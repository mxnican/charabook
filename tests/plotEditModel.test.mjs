import assert from 'node:assert/strict'
import {
  buildPlotBoardSummary,
  extractPlotCardsFromItem,
  movePlotCard,
  movePlotCardByOffset,
} from '../src/lib/plotEditModelCore.js'

const fallbackCards = extractPlotCardsFromItem({
  content: '清晨，阳光落进房间。\n空气里有咖啡味。',
})

assert.equal(fallbackCards.length, 1)
assert.equal(fallbackCards[0].type, 'scene')
assert.equal(fallbackCards[0].content, '清晨，阳光落进房间。\n空气里有咖啡味。')

const summary = buildPlotBoardSummary([
  { content: '林景深走进门口。' },
  { content: '他抬手看了眼时间。' },
  { content: '' },
])

assert.deepEqual(summary, {
  title: '林景深走进门口。',
  content: '林景深走进门口。\n他抬手看了眼时间。',
})

const reordered = movePlotCard(
  [
    { id: 'a', content: 'A' },
    { id: 'b', content: 'B' },
    { id: 'c', content: 'C' },
  ],
  'c',
  0,
)

assert.deepEqual(
  reordered.map((card) => card.id),
  ['c', 'a', 'b'],
)

const movedUp = movePlotCardByOffset(
  [
    { id: 'a', content: 'A' },
    { id: 'b', content: 'B' },
    { id: 'c', content: 'C' },
  ],
  'b',
  -1,
)

assert.deepEqual(
  movedUp.map((card) => card.id),
  ['b', 'a', 'c'],
)

const movedDown = movePlotCardByOffset(
  [
    { id: 'a', content: 'A' },
    { id: 'b', content: 'B' },
    { id: 'c', content: 'C' },
  ],
  'b',
  1,
)

assert.deepEqual(
  movedDown.map((card) => card.id),
  ['a', 'c', 'b'],
)
