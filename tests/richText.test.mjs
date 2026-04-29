import assert from 'node:assert/strict'
import {
  getRichTextFormatStateFromHtml,
  htmlToTextLines,
  normalizeRichTextHtml,
} from '../src/lib/richText.js'

const lines = htmlToTextLines('<p><strong>标题</strong></p><p>第二行 <em>内容</em></p>')

assert.deepEqual(lines, ['标题', '第二行 内容'])
assert.equal(normalizeRichTextHtml('<div><br></div>'), '')

const formatState = getRichTextFormatStateFromHtml('<h2><strong>标题</strong></h2><ol><li>第一项</li></ol>')

assert.equal(formatState.heading, true)
assert.equal(formatState.bold, true)
assert.equal(formatState.orderedList, true)
assert.equal(formatState.unorderedList, false)
