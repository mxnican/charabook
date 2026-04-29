const BLOCK_TAGS = [
  'p',
  'div',
  'li',
  'blockquote',
  'pre',
  'section',
  'article',
  'header',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]

const ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

function decodeEntities(text) {
  return String(text)
    .replace(/&(#\d+|#x[a-f\d]+|[a-z]+);/gi, (match, entity) => {
      if (entity[0] === '#') {
        const value = entity[1].toLowerCase() === 'x'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10)
        return Number.isFinite(value) ? String.fromCodePoint(value) : match
      }
      const key = entity.toLowerCase()
      return Object.prototype.hasOwnProperty.call(ENTITY_MAP, key) ? ENTITY_MAP[key] : match
    })
    .replace(/\u00a0/g, ' ')
}

function stripHtml(html) {
  const text = String(html || '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
  const blockPattern = new RegExp(`<\/?(?:${BLOCK_TAGS.join('|')})\\b[^>]*>`, 'gi')
  return text
    .replace(blockPattern, '\n')
    .replace(/<[^>]*>/g, '')
}

export function htmlToTextLines(html) {
  const plain = decodeEntities(stripHtml(html))
  return plain
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function normalizeRichTextHtml(html) {
  const raw = typeof html === 'string' ? html : ''
  return htmlToTextLines(raw).length > 0 ? raw.trim() : ''
}

export function getRichTextFormatStateFromHtml(html) {
  const raw = String(html || '').toLowerCase()
  return {
    bold: /<(strong|b)\b/.test(raw),
    italic: /<(em|i)\b/.test(raw),
    underline: /<u\b/.test(raw),
    strikeThrough: /<(s|strike|del)\b/.test(raw),
    heading: /<h[1-6]\b/.test(raw),
    orderedList: /<ol\b/.test(raw),
    unorderedList: /<ul\b/.test(raw),
  }
}
