const CARD_TYPE_LIST = [
  'scene',
  'action',
  'expression',
  'shot',
  'dialogue',
]

function randomId() {
  return globalThis.crypto?.randomUUID?.() || `card-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function todayString() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeType(type) {
  return CARD_TYPE_LIST.includes(type) ? type : 'scene'
}

function normalizeContent(content) {
  return typeof content === 'string' ? content : ''
}

export function createPlotCard(type = 'scene', index = 0, content = '') {
  const now = todayString()
  return {
    id: randomId(),
    type: normalizeType(type),
    content: normalizeContent(content),
    createdAt: now,
    updatedAt: now,
    sortIndex: index,
  }
}

export function normalizePlotCard(card, index = 0) {
  const base = createPlotCard(card?.type, index, card?.content)
  return {
    ...base,
    id: card?.id || base.id,
    type: normalizeType(card?.type),
    content: normalizeContent(card?.content),
    createdAt: typeof card?.createdAt === 'string' && card.createdAt ? card.createdAt : base.createdAt,
    updatedAt: typeof card?.updatedAt === 'string' && card.updatedAt ? card.updatedAt : base.updatedAt,
    sortIndex: Number.isFinite(card?.sortIndex) ? card.sortIndex : index,
  }
}

export function normalizePlotCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return []
  return cards.map((card, index) => normalizePlotCard(card, index))
}

export function movePlotCard(cards, cardId, targetIndex) {
  const normalized = normalizePlotCards(cards)
  const fromIndex = normalized.findIndex((card) => card.id === cardId)
  if (fromIndex < 0 || normalized.length === 0) return normalized

  const clampedTarget = Math.max(0, Math.min(targetIndex, normalized.length))
  if (fromIndex === clampedTarget) return normalized

  const nextCards = normalized.slice()
  const [movedCard] = nextCards.splice(fromIndex, 1)
  nextCards.splice(clampedTarget, 0, movedCard)

  return nextCards.map((card, index) => ({
    ...card,
    sortIndex: index,
  }))
}

export function movePlotCardByOffset(cards, cardId, offset) {
  const normalized = normalizePlotCards(cards)
  const fromIndex = normalized.findIndex((card) => card.id === cardId)
  if (fromIndex < 0 || normalized.length === 0 || !Number.isFinite(offset) || offset === 0) {
    return normalized
  }

  const targetIndex = fromIndex + offset
  if (targetIndex < 0 || targetIndex >= normalized.length) {
    return normalized
  }

  return movePlotCard(normalized, cardId, targetIndex)
}

export function extractPlotCardsFromItem(item) {
  if (Array.isArray(item?.cards) && item.cards.length > 0) {
    return normalizePlotCards(item.cards)
  }

  const fallback = normalizeContent(item?.content).trim()
  return fallback ? [createPlotCard('scene', 0, fallback)] : []
}

export function buildPlotBoardSummary(cards) {
  const lines = normalizePlotCards(cards)
    .map((card) => card.content.trim())
    .filter(Boolean)

  return {
    title: lines[0] || '',
    content: lines.join('\n'),
  }
}
