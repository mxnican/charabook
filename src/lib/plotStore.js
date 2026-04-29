const STORAGE_KEY = 'charabook.plots.v1'

const SEED_ITEMS = [
  {
    id: 'seed-plot-1',
    kind: 'plot',
    title: '第一章：误会',
    content: '一次临时的合作把两个人重新推回同一条轨道，旧误会还没解开，新秘密先冒了出来。',
    createdAt: '2026-04-18',
    updatedAt: '2026-04-20',
  },
  {
    id: 'seed-idea-1',
    kind: 'idea',
    title: '雨夜便利店',
    content: '主角总在凌晨两点遇到同一个人，对方每次都只买一瓶温牛奶。',
    createdAt: '2026-04-19',
    updatedAt: '2026-04-19',
  },
  {
    id: 'seed-plot-2',
    kind: 'plot',
    title: '第三章：靠近',
    content: '为了找到失踪线索，他们不得不假扮成一对临时搭档，关系在试探里一点点变得复杂。',
    createdAt: '2026-04-20',
    updatedAt: '2026-04-22',
  },
  {
    id: 'seed-idea-2',
    kind: 'idea',
    title: '台词碎片',
    content: '“如果你还会回来，那就别再用离开的方式告别。”',
    createdAt: '2026-04-21',
    updatedAt: '2026-04-21',
  },
  {
    id: 'seed-plot-3',
    kind: 'plot',
    title: '终局前夜',
    content: '所有证据都指向同一个人，但最致命的真相是：他从一开始就在替别人遮掩。',
    createdAt: '2026-04-22',
    updatedAt: '2026-04-24',
  },
]

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
  return {
    id: item?.id || crypto.randomUUID(),
    kind,
    title: typeof item?.title === 'string' ? item.title : '',
    content: typeof item?.content === 'string' ? item.content : '',
    createdAt: typeof item?.createdAt === 'string' && item.createdAt ? item.createdAt : todayString(),
    updatedAt: typeof item?.updatedAt === 'string' && item.updatedAt ? item.updatedAt : todayString(),
    sortIndex: Number.isFinite(item?.sortIndex) ? item.sortIndex : index,
  }
}

function seedItems() {
  const seeded = SEED_ITEMS.map((item, index) => normalizeItem(item, index))
  savePlotItems(seeded)
  return seeded
}

export function loadPlotItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedItems()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seedItems()
    return parsed.map((item, index) => normalizeItem(item, index))
  } catch {
    return seedItems()
  }
}

export function savePlotItems(items) {
  localStorage.setItem(
    STORAGE_KEY,
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

export function upsertPlotItem(nextItem) {
  const items = loadPlotItems()
  const normalized = normalizeItem(nextItem, items.length)
  const index = items.findIndex((item) => item.id === normalized.id)
  const next = index >= 0
    ? items.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...items]
  savePlotItems(next)
  return normalized
}

export function removePlotItems(ids) {
  const idSet = new Set(ids)
  const next = loadPlotItems().filter((item) => !idSet.has(item.id))
  savePlotItems(next)
  return next
}

export function getPlotItemById(id) {
  return loadPlotItems().find((item) => item.id === id) || null
}

export function countPlotWords(content, title = '') {
  const text = `${title}${content}`.replace(/\s+/g, '')
  return text.length
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
    items.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      content: item.content,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    null,
    2,
  )
}
