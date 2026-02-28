<script setup lang="ts">
defineOptions({ name: 'MemeList' })
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  onActivated,
  onDeactivated,
  watch,
  nextTick,
} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MemeInfo } from '../types'
import type { SortBy } from '../api'
import { getMemeInfos, searchMemes, getImageUrl, getMemePreview } from '../api'
import MemeCard from '../components/MemeCard.vue'

const router = useRouter()
const route = useRoute()

// 回到顶部按钮相关
const showBackToTop = ref(false)
function handleScroll() {
  showBackToTop.value = window.scrollY > 400
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

let savedScrollY = 0

onDeactivated(() => {
  savedScrollY = window.scrollY
})

onActivated(() => {
  // Apply tag from query param (e.g. clicked from MemeGenerator)
  const tagParam = route.query.tag as string | undefined
  if (tagParam && allTags.value.includes(tagParam)) {
    selectedTag.value = tagParam
    shuffleTags()
    // Scroll to top when filtering by a new tag
    nextTick(() => window.scrollTo(0, 0))
  } else {
    if (tagParam && !allTags.value.includes(tagParam)) {
      selectedTag.value = null
    }
    nextTick(() => {
      setTimeout(() => window.scrollTo(0, savedScrollY), 50)
    })
  }
})

const allMemes = ref<MemeInfo[]>([])
const searchQuery = ref('')
const searchResults = ref<string[] | null>(null)
const loading = ref(true)
const previewCache = ref<Record<string, string>>({})
const selectedTag = ref<string | null>(null)

const sortBy = ref<SortBy>('keywords_pinyin')
const sortReverse = ref(false)
const showSortMenu = ref(false)
const sortLabels: Record<SortBy, string> = {
  key: '表情key',
  keywords: '关键词',
  keywords_pinyin: '关键词拼音',
  date_created: '创建时间',
  date_modified: '修改时间',
}
const TAG_DISPLAY_COUNT = 6
const displayedTags = ref<string[]>([])
const tagFading = ref(false)

function shuffleTags() {
  const all = allTags.value
  // Keep selected tag if any, fill rest randomly
  const pool = selectedTag.value ? all.filter((t) => t !== selectedTag.value) : [...all]
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const picked = pool.slice(0, selectedTag.value ? TAG_DISPLAY_COUNT - 1 : TAG_DISPLAY_COUNT)
  if (selectedTag.value) picked.unshift(selectedTag.value)
  displayedTags.value = picked
}

function refreshTags() {
  tagFading.value = true
  setTimeout(() => {
    shuffleTags()
    tagFading.value = false
  }, 200)
}

// Collect all tags
const allTags = computed(() => {
  const tagSet = new Set<string>()
  allMemes.value.forEach((m) => m.tags.forEach((t) => tagSet.add(t)))
  return Array.from(tagSet).sort()
})

const displayedMemes = computed(() => {
  let memes = [...allMemes.value]

  if (searchResults.value !== null) {
    const keySet = new Set(searchResults.value)
    memes = memes.filter((m) => keySet.has(m.key))
    // Sort by search result order when in search mode and using default sort
    if (!sortReverse.value) {
      memes.sort(
        (a, b) => searchResults.value!.indexOf(a.key) - searchResults.value!.indexOf(b.key),
      )
    }
  }

  if (selectedTag.value) {
    memes = memes.filter((m) => m.tags.includes(selectedTag.value!))
  }

  return memes
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!val.trim()) {
    searchResults.value = null
    return
  }
  searchTimeout = setTimeout(async () => {
    try {
      searchResults.value = await searchMemes(val.trim(), true)
    } catch {
      searchResults.value = null
    }
  }, 300)
})

function selectTag(tag: string) {
  if (selectedTag.value === tag) {
    selectedTag.value = null
    // Remove tag query from URL
    router.replace({ name: 'home', query: {} })
  } else {
    selectedTag.value = tag
    // Add tag query to URL
    router.replace({ name: 'home', query: { tag } })
  }
}

function selectSort(key: string) {
  const newSortBy = key as SortBy
  if (newSortBy === sortBy.value) {
    sortReverse.value = !sortReverse.value
  } else {
    sortBy.value = newSortBy
    sortReverse.value = false
  }
  showSortMenu.value = false
  fetchMemes()
}

function goToMeme(key: string) {
  router.push({ name: 'meme', params: { memeKey: key } })
}

function goToRandomMeme() {
  const pool = displayedMemes.value.length ? displayedMemes.value : allMemes.value
  if (!pool.length) return
  const pick = pool[Math.floor(Math.random() * pool.length)]
  router.push({ name: 'meme', params: { memeKey: pick.key } })
}

async function loadPreview(key: string) {
  if (previewCache.value[key]) return
  try {
    const resp = await getMemePreview(key)
    previewCache.value[key] = getImageUrl(resp.image_id)
  } catch {
    // ignore
  }
}

async function fetchMemes() {
  try {
    allMemes.value = await getMemeInfos(sortBy.value, sortReverse.value)
  } catch (err) {
    console.error('Failed to load memes:', err)
  }
}

onMounted(async () => {
  try {
    await fetchMemes()
  } finally {
    loading.value = false
  }
  // Check for tag query param
  const tagParam = route.query.tag as string | undefined
  if (tagParam && allTags.value.includes(tagParam)) {
    selectedTag.value = tagParam
  }
  // Initialize random tags
  shuffleTags()
  // Close sort menu on outside click
  document.addEventListener('click', onClickOutsideSortMenu)

  // 监听滚动事件
  window.addEventListener('scroll', handleScroll)
})

function onClickOutsideSortMenu(e: MouseEvent) {
  if (showSortMenu.value) {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      showSortMenu.value = false
    }
  }
}

onUnmounted(() => {
  document.removeEventListener('click', onClickOutsideSortMenu)
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Hero section -->
    <div class="mb-10 text-center">
      <h2 class="mb-3 text-3xl font-bold text-gray-900">选择一个模板开始制作</h2>
      <p class="text-lg text-gray-500">从 {{ allMemes.length }} 个表情包模板中挑选</p>
    </div>

    <!-- Search bar -->
    <div class="mx-auto mb-8 max-w-2xl">
      <div class="flex gap-1">
        <div class="relative flex-1">
          <svg
            class="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索表情包（关键词、标签）..."
            class="input w-full rounded-xl py-3 pl-11 pr-10 text-base"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <button
          @click="goToRandomMeme"
          class="dice-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors duration-200 hover:text-gray-700"
          title="随机表情"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M16 3h5v5" />
            <path d="M4 20L21 3" />
            <path d="M21 16v5h-5" />
            <path d="M15 15l6 6" />
            <path d="M4 4l5 5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tags filter -->
    <div v-if="allTags.length" class="mb-8 flex items-center justify-center gap-2">
      <div
        class="flex items-center gap-2 transition-opacity duration-200"
        :class="tagFading ? 'opacity-0' : 'opacity-100'"
      >
        <button
          v-for="tag in displayedTags"
          :key="tag"
          @click="selectTag(tag)"
          :class="[
            'whitespace-nowrap rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors duration-150',
            selectedTag === tag
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          ]"
        >
          {{ tag }}
        </button>
      </div>
      <button
        @click="refreshTags"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-all duration-200 hover:bg-gray-200 hover:text-gray-600"
        title="换一批"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h4.586M20 20v-5h-4.586M4.929 9A9 9 0 0119.071 9M19.071 15A9 9 0 014.929 15"
          />
        </svg>
      </button>
    </div>

    <!-- Sort bar -->
    <div class="mb-6 flex items-center justify-end">
      <div class="relative">
        <button
          @click="showSortMenu = !showSortMenu"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm leading-5 text-gray-600 transition-colors hover:bg-gray-100"
        >
          <svg
            class="h-4 w-4 shrink-0 translate-y-px text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4h18M3 8h14m-14 4h10m-10 4h6"
            />
          </svg>
          <span>{{ sortLabels[sortBy] }}</span>
          <svg
            class="h-3 w-3 shrink-0 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              :d="sortReverse ? 'M12 4v16m0 0l-5-5m5 5l5-5' : 'M12 20V4m0 0l-5 5m5-5l5 5'"
            />
          </svg>
          <svg
            class="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform"
            :class="showSortMenu ? 'rotate-180' : ''"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <Transition name="fade">
          <div
            v-if="showSortMenu"
            class="absolute right-0 top-full z-30 mt-1 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button
              v-for="(label, key) in sortLabels"
              :key="key"
              @click="selectSort(key as string)"
              :class="[
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors',
                sortBy === key
                  ? 'bg-primary-50 font-medium text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50',
              ]"
            >
              <span>{{ label }}</span>
              <svg
                v-if="sortBy === key"
                class="h-3 w-3 shrink-0 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  :d="sortReverse ? 'M12 4v16m0 0l-5-5m5 5l5-5' : 'M12 20V4m0 0l-5 5m5-5l5 5'"
                />
              </svg>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="flex items-center gap-3 text-gray-500">
        <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>加载中...</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="displayedMemes.length === 0" class="py-20 text-center">
      <div class="mb-4 text-5xl">🔍</div>
      <h3 class="mb-2 text-lg font-medium text-gray-900">没有找到匹配的表情包</h3>
      <p class="text-gray-500">尝试使用其他关键词搜索</p>
    </div>

    <!-- Meme grid -->
    <div
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      <MemeCard
        v-for="meme in displayedMemes"
        :key="meme.key"
        :meme="meme"
        :preview-url="previewCache[meme.key]"
        @click="goToMeme(meme.key)"
        @load-preview="loadPreview(meme.key)"
      />
    </div>

    <!-- Result count -->
    <div
      v-if="!loading && displayedMemes.length > 0"
      class="mt-8 text-center text-sm text-gray-400"
    >
      {{ displayedMemes.length }} 个结果
    </div>

    <!-- 回到顶部按钮 -->
    <Transition name="fade">
      <button
        v-if="showBackToTop"
        @click="scrollToTop"
        class="fixed bottom-8 right-8 z-50 rounded-full bg-primary-500 p-3 text-white shadow-lg transition-colors hover:bg-primary-600"
        style="box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12)"
        title="回到顶部"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </Transition>
  </div>
</template>
