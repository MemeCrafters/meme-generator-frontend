import type { MemeInfo, UploadImageResponse, ImageResponse, ErrorResponse } from './types'

const STORAGE_KEY = 'meme-generator-backend-url'
const DEFAULT_BASE = 'http://localhost:2233'

let BASE = localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE

export function getBackendUrl(): string {
  return BASE
}

export function setBackendUrl(url: string) {
  const trimmed = url.replace(/\/+$/, '').trim()
  BASE = trimmed || DEFAULT_BASE
  if (trimmed && trimmed !== DEFAULT_BASE) {
    localStorage.setItem(STORAGE_KEY, trimmed)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function isCustomBackend(): boolean {
  return BASE !== DEFAULT_BASE
}

export class MemeError extends Error {
  code: number
  data: any

  constructor(code: number, message: string, data: any = null) {
    super(message)
    this.name = 'MemeError'
    this.code = code
    this.data = data
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    if (body && 'code' in body) {
      const err = body as ErrorResponse
      throw new MemeError(err.code, err.message, err.data)
    }
    throw new MemeError(0, `HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

export async function getMemeKeys(sortBy?: SortBy, sortReverse = false): Promise<string[]> {
  const params = new URLSearchParams()
  if (sortBy) params.set('sort_by', sortBy)
  if (sortReverse) params.set('sort_reverse', 'true')
  const qs = params.toString()
  return request<string[]>(`/meme/keys${qs ? `?${qs}` : ''}`)
}

export async function getMemeInfos(sortBy?: SortBy, sortReverse = false): Promise<MemeInfo[]> {
  const params = new URLSearchParams()
  if (sortBy) params.set('sort_by', sortBy)
  if (sortReverse) params.set('sort_reverse', 'true')
  const qs = params.toString()
  return request<MemeInfo[]>(`/meme/infos${qs ? `?${qs}` : ''}`)
}

export type SortBy = 'key' | 'keywords' | 'keywords_pinyin' | 'date_created' | 'date_modified'

export async function getMemeInfo(key: string): Promise<MemeInfo> {
  return request<MemeInfo>(`/memes/${key}/info`)
}

export async function searchMemes(query: string, includeTags = false): Promise<string[]> {
  const params = new URLSearchParams({ query })
  if (includeTags) params.set('include_tags', 'true')
  return request<string[]>(`/meme/search?${params}`)
}

export async function getMemePreview(
  key: string,
  options?: Record<string, any>,
): Promise<ImageResponse> {
  if (options && Object.keys(options).length > 0) {
    return request<ImageResponse>(`/memes/${key}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options }),
    })
  }
  return request<ImageResponse>(`/memes/${key}/preview`)
}

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE}/image/upload/multipart`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || `Upload failed: ${res.statusText}`)
  }
  return res.json()
}

export async function generateMeme(
  key: string,
  images: { name: string; id: string }[],
  texts: string[],
  options: Record<string, any>,
): Promise<ImageResponse> {
  return request<ImageResponse>(`/memes/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images, texts, options }),
  })
}

export function getImageUrl(imageId: string): string {
  return `${BASE}/image/${imageId}`
}

export async function getVersion(): Promise<string> {
  const res = await fetch(`${BASE}/meme/version`)
  return res.text()
}
