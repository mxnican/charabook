import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const viewSource = readFileSync(new URL('../src/views/PlotEditView.vue', import.meta.url), 'utf8')
const styleSource = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

assert.ok(
  viewSource.includes("'is-menu-open': menuOpenCardId === card.id"),
  'plot editor cards should expose an open-menu state class',
)

assert.ok(
  styleSource.includes('.plot-editor-card.is-menu-open'),
  'plot editor cards with open menus should have a dedicated stacking rule',
)

const moveFunctionMatch = viewSource.match(/function moveCardByOffset\(cardId, offset\) \{[\s\S]*?\n\}/)

assert.ok(moveFunctionMatch, 'plot editor move handler should exist')
assert.ok(
  !moveFunctionMatch[0].includes('persistDraft('),
  'moving a plot card should not auto-save',
)
