const STORAGE_PREFIX = 'charabook.characters.v1'

function storageKey(workId) {
  return `${STORAGE_PREFIX}.${workId || 'default'}`
}

function todayString() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createBaseCharacter(index = 0) {
  return {
    id: crypto.randomUUID(),
    name: '',
    avatar: '',
    gender: '',
    hairstyle: '',
    eyeColor: '',
    height: '',
    settings: [
      { id: crypto.randomUUID(), label: '性格', value: '' },
      { id: crypto.randomUUID(), label: '职业', value: '' },
    ],
    experience: '',
    summary: '',
    createdAt: todayString(),
    sortIndex: index,
  }
}

function normalizeSetting(setting) {
  return {
    id: setting?.id || crypto.randomUUID(),
    label: typeof setting?.label === 'string' ? setting.label : '',
    value: typeof setting?.value === 'string' ? setting.value : '',
  }
}

function normalizeCharacter(character, index = 0) {
  const base = createBaseCharacter(index)
  return {
    ...base,
    id: character?.id || base.id,
    name: typeof character?.name === 'string' ? character.name : '',
    avatar: typeof character?.avatar === 'string' ? character.avatar : '',
    gender: typeof character?.gender === 'string' ? character.gender : '',
    hairstyle: typeof character?.hairstyle === 'string' ? character.hairstyle : '',
    eyeColor: typeof character?.eyeColor === 'string' ? character.eyeColor : '',
    height: typeof character?.height === 'string' ? character.height : '',
    settings: Array.isArray(character?.settings) && character.settings.length > 0
      ? character.settings.map(normalizeSetting)
      : base.settings,
    experience: typeof character?.experience === 'string' ? character.experience : '',
    summary: typeof character?.summary === 'string' ? character.summary : '',
    createdAt: typeof character?.createdAt === 'string' && character.createdAt ? character.createdAt : base.createdAt,
    sortIndex: Number.isFinite(character?.sortIndex) ? character.sortIndex : index,
  }
}

export function createEmptyCharacterDraft(index = 0) {
  return normalizeCharacter({}, index)
}

export function loadCharacters(workId) {
  try {
    const raw = localStorage.getItem(storageKey(workId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((character, index) => normalizeCharacter(character, index))
  } catch {
    return []
  }
}

export function saveCharacters(workId, characters) {
  localStorage.setItem(
    storageKey(workId),
    JSON.stringify(characters.map((character, index) => normalizeCharacter(character, index))),
  )
}

export function getCharacterById(workId, characterId) {
  return loadCharacters(workId).find((character) => character.id === characterId) || null
}

export function upsertCharacter(workId, nextCharacter) {
  const characters = loadCharacters(workId)
  const normalized = normalizeCharacter(nextCharacter, characters.length)
  const index = characters.findIndex((character) => character.id === normalized.id)
  const next = index >= 0
    ? characters.map((character) => (character.id === normalized.id ? normalized : character))
    : [...characters, normalized]
  saveCharacters(workId, next)
  return normalized
}

export function removeCharacter(workId, characterId) {
  const next = loadCharacters(workId).filter((character) => character.id !== characterId)
  saveCharacters(workId, next)
  return next
}

export function ensureInitialCharacter(workId) {
  const characters = loadCharacters(workId)
  if (characters.length > 0) return characters
  const first = createEmptyCharacterDraft(0)
  saveCharacters(workId, [first])
  return [first]
}
