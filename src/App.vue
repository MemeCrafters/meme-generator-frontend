<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getVersion, getBackendUrl, setBackendUrl, isCustomBackend } from './api'

const version = ref('')
const showSettings = ref(false)
const backendInput = ref('')
const backendStatus = ref<'idle' | 'testing' | 'ok' | 'error'>('idle')

onMounted(async () => {
  try {
    version.value = await getVersion()
  } catch {
    // ignore
  }
})

function openSettings() {
  backendInput.value = isCustomBackend() ? getBackendUrl() : ''
  backendStatus.value = 'idle'
  showSettings.value = true
}

async function testConnection() {
  const url = backendInput.value.replace(/\/+$/, '').trim() || getBackendUrl()
  backendStatus.value = 'testing'
  try {
    const res = await fetch(`${url}/meme/version`)
    if (res.ok) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('text/html')) {
        backendStatus.value = 'error'
      } else {
        const text = await res.text()
        if (/^\d+\.\d+/.test(text.trim())) {
          backendStatus.value = 'ok'
        } else {
          backendStatus.value = 'error'
        }
      }
    } else {
      backendStatus.value = 'error'
    }
  } catch {
    backendStatus.value = 'error'
  }
}

function saveBackend() {
  setBackendUrl(backendInput.value)
  showSettings.value = false
  window.location.reload()
}

function resetBackend() {
  backendInput.value = ''
  backendStatus.value = 'idle'
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-lg">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <router-link to="/" class="flex items-center gap-3 transition-opacity hover:opacity-80">
            <span class="text-2xl">😂</span>
            <h1
              class="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-xl font-bold text-transparent"
            >
              表情包生成器
            </h1>
          </router-link>
          <div class="flex items-center gap-4">
            <span v-if="version" class="badge-gray text-xs">v{{ version }}</span>
            <button
              @click="openSettings"
              class="text-gray-400 transition-colors hover:text-gray-600"
              :class="{ '!text-primary-500': isCustomBackend() }"
              title="后端设置"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <a
              href="https://github.com/MemeCrafters/meme-generator-rs"
              target="_blank"
              class="text-gray-400 transition-colors hover:text-gray-600"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200/60 bg-white/50">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p class="text-center text-sm text-gray-400">Meme Generator &mdash; 表情包生成器</p>
      </div>
    </footer>

    <!-- Settings Modal -->
    <Transition name="fade">
      <div
        v-if="showSettings"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="showSettings = false"
      >
        <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">后端设置</h3>
            <button
              @click="showSettings = false"
              class="text-gray-400 transition-colors hover:text-gray-600"
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

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">后端地址</label>
              <div class="flex gap-2">
                <input
                  v-model="backendInput"
                  type="text"
                  class="input flex-1"
                  placeholder="默认: http://localhost:2233"
                  @keyup.enter="testConnection"
                />
                <button
                  v-if="backendInput"
                  @click="resetBackend"
                  class="shrink-0 rounded-lg px-3 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  title="重置"
                >
                  重置
                </button>
              </div>
              <p class="mt-1 text-xs text-gray-400">
                输入后端服务器的完整地址，例如 http://127.0.0.1:2233
              </p>
            </div>

            <div class="flex items-center gap-3">
              <button
                @click="testConnection"
                :disabled="backendStatus === 'testing'"
                class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span v-if="backendStatus === 'testing'">测试中...</span>
                <span v-else>测试连接</span>
              </button>
              <span v-if="backendStatus === 'ok'" class="text-sm text-green-600">✓ 连接成功</span>
              <span v-else-if="backendStatus === 'error'" class="text-sm text-red-500"
                >✗ 连接失败</span
              >
            </div>

            <div class="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                @click="showSettings = false"
                class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                取消
              </button>
              <button @click="saveBackend" class="btn-primary px-4 py-2 text-sm">保存并刷新</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
