export const COVER_THEMES = [
  'linear-gradient(180deg, #dff0ff 0%, #bedbff 48%, #f8fbff 100%)',
  'linear-gradient(180deg, #e6f7ff 0%, #d2ecff 46%, #f5fbff 100%)',
  'linear-gradient(180deg, #dbe9ff 0%, #c5d7ff 44%, #f6f8ff 100%)',
]

export function getThemeByIndex(index = 0) {
  return COVER_THEMES[((index % COVER_THEMES.length) + COVER_THEMES.length) % COVER_THEMES.length]
}
