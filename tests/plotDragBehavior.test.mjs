import assert from 'node:assert/strict'
import { getPlotCardDragHoldDelay } from '../src/lib/plotDragBehavior.js'

assert.equal(getPlotCardDragHoldDelay('mouse'), 280)
assert.equal(getPlotCardDragHoldDelay('touch'), 280)
