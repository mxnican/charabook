import { normalizePlotCards } from './plotEditModel'

const STORAGE_PREFIX = 'charabook.plots.v1'
const LEGACY_STORAGE_KEY = 'charabook.plots.v1'

function todayString() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeKind(kind) {
  return kind === 'idea' ? 'idea' : 'plot'
}

function normalizeItem(item, index = 0) {
  const kind = normalizeKind(item?.kind)
  const cards = Array.isArray(item?.cards) ? normalizePlotCards(item.cards) : undefined
  return {
    id: item?.id || crypto.randomUUID(),
    kind,
    title: typeof item?.title === 'string' ? item.title : '',
    content: typeof item?.content === 'string' ? item.content : '',
    createdAt: typeof item?.createdAt === 'string' && item.createdAt ? item.createdAt : todayString(),
    updatedAt: typeof item?.updatedAt === 'string' && item.updatedAt ? item.updatedAt : todayString(),
    sortIndex: Number.isFinite(item?.sortIndex) ? item.sortIndex : index,
    ...(cards ? { cards } : {}),
  }
}

function storageKey(workId) {
  return `${STORAGE_PREFIX}.${workId || 'default'}`
}

function readRawItems(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function loadPlotItems(workId) {
  const key = storageKey(workId)
  const parsed = readRawItems(key)
  if (parsed) return parsed.map((item, index) => normalizeItem(item, index))

  const legacyParsed = readRawItems(LEGACY_STORAGE_KEY)
  if (legacyParsed) {
    const normalized = legacyParsed.map((item, index) => normalizeItem(item, index))
    savePlotItems(workId, normalized)
    return normalized
  }

  return []
}

export function savePlotItems(workId, items) {
  localStorage.setItem(
    storageKey(workId),
    JSON.stringify(items.map((item, index) => normalizeItem(item, index))),
  )
}

export function createPlotDraft(kind = 'plot') {
  const nextKind = normalizeKind(kind)
  return {
    id: crypto.randomUUID(),
    kind: nextKind,
    title: '',
    content: '',
    createdAt: todayString(),
    updatedAt: todayString(),
  }
}

export function upsertPlotItem(workId, nextItem) {
  const items = loadPlotItems(workId)
  const normalized = normalizeItem(nextItem, items.length)
  const index = items.findIndex((item) => item.id === normalized.id)
  const next = index >= 0
    ? items.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...items]
  savePlotItems(workId, next)
  return normalized
}

export function removePlotItems(workId, ids) {
  const idSet = new Set(ids)
  const next = loadPlotItems(workId).filter((item) => !idSet.has(item.id))
  savePlotItems(workId, next)
  return next
}

export function getPlotItemById(workId, id) {
  return loadPlotItems(workId).find((item) => item.id === id) || null
}

export function countPlotWords(content, title = '') {
  const text = `${title}${content}`.replace(/\s+/g, '')
  if (!text) return 0

  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter('zh-Hans', { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text)).length
  }

  return Array.from(text).length
}

export function getContentHeadline(content) {
  const text = typeof content === 'string' ? content : ''
  const firstLine = text.split(/\r?\n/)[0].trim()
  return firstLine
}

export function getContentBody(content) {
  const text = typeof content === 'string' ? content : ''
  const lines = text.split(/\r?\n/)
  if (lines.length <= 1) return ''
  return lines.slice(1).join('\n').trim()
}

export function formatDateLabel(dateString) {
  if (typeof dateString !== 'string' || !dateString) return ''
  return dateString.replace(/-/g, '/')
}

export function serializePlotItems(items) {
  return JSON.stringify(
    items.map((item) => {
      const normalized = normalizeItem(item)
      return {
        id: normalized.id,
        kind: normalized.kind,
        title: normalized.title,
        content: normalized.content,
        createdAt: normalized.createdAt,
        updatedAt: normalized.updatedAt,
        ...(Array.isArray(normalized.cards) ? { cards: normalized.cards } : {}),
      }
    }),
    null,
    2,
  )
}
