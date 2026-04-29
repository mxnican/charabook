import { getThemeByIndex } from './coverThemes'

const STORAGE_KEY = 'charabook.works.v1'

function todayString() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nextThemeIndex() {
  return loadWorks().length % 3
}

function normalizeWork(work, index = 0) {
  const createdAt = work.createdAt || todayString()
  return {
    id: work.id || crypto.randomUUID(),
    title: typeof work.title === 'string' ? work.title : '',
    createdAt,
    updatedAt: work.updatedAt || createdAt,
    coverTheme: Number.isInteger(work.coverTheme) ? work.coverTheme : index % 3,
    intro: work.intro || '',
    cover: work.cover || '',
  }
}

export function loadWorks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((work, index) => normalizeWork(work, index))
  } catch {
    return []
  }
}

export function saveWorks(works) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(works))
}

export function getWorkById(id) {
  return loadWorks().find((work) => work.id === id) || null
}

export function createEmptyWorkDraft() {
  const now = todayString()
  return {
    id: crypto.randomUUID(),
    title: '',
    createdAt: now,
    updatedAt: '',
    coverTheme: nextThemeIndex(),
    intro: '',
    cover: '',
  }
}

export function upsertWork(nextWork) {
  const works = loadWorks()
  const normalized = normalizeWork({
    ...nextWork,
    updatedAt: todayString(),
  }, works.length)
  const index = works.findIndex((work) => work.id === normalized.id)
  const next = index >= 0
    ? works.map((work) => (work.id === normalized.id ? normalized : work))
    : [normalized, ...works]
  saveWorks(next)
  return normalized
}

export function removeWorks(ids) {
  const idSet = new Set(ids)
  const next = loadWorks().filter((work) => !idSet.has(work.id))
  saveWorks(next)
  return next
}

export function getCoverForWork(work) {
  return work.cover || getThemeByIndex(work.coverTheme)
}
