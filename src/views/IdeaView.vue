<template>
  <main class="text-editor-page text-editor-page--idea">
    <section class="text-editor-shell">
      <header class="text-editor-topbar">
        <button class="text-editor-back" type="button" aria-label="返回" @click="handleBack">←</button>
        <h1 class="text-editor-title">灵感记录</h1>
        <button class="text-editor-save" type="button" :disabled="!isDirty" @click="saveDraft">
          保存
        </button>
      </header>

      <div class="text-editor-toolbar" aria-label="文字样式工具条">
        <button
          type="button"
          class="text-editor-toolbar__button"
          :class="{ 'is-active': toolbarState.bold }"
          :aria-pressed="toolbarState.bold"
          @mousedown.prevent
          @click="applyFormat('bold')"
        >
          B
        </button>
        <button
          type="button"
          class="text-editor-toolbar__button"
          :class="{ 'is-active': toolbarState.italic }"
          :aria-pressed="toolbarState.italic"
          @mousedown.prevent
          @click="applyFormat('italic')"
        >
          I
        </button>
        <button
          type="button"
          class="text-editor-toolbar__button"
          :class="{ 'is-active': toolbarState.underline }"
          :aria-pressed="toolbarState.underline"
          @mousedown.prevent
          @click="applyFormat('underline')"
        >
          U
        </button>
        <button
          type="button"
          class="text-editor-toolbar__button"
          :class="{ 'is-active': toolbarState.strikeThrough }"
          :aria-pressed="toolbarState.strikeThrough"
          @mousedown.prevent
          @click="applyFormat('strikeThrough')"
        >
          S
        </button>
        <button
          type="button"
          class="text-editor-toolbar__button text-editor-toolbar__button--icon"
          :class="{ 'is-active': toolbarState.orderedList }"
          :aria-pressed="toolbarState.orderedList"
          @mousedown.prevent
          @click="toggleList('insertOrderedList')"
        >
          <img :src="numIcon" alt="" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="text-editor-toolbar__button text-editor-toolbar__button--icon"
          :class="{ 'is-active': toolbarState.unorderedList }"
          :aria-pressed="toolbarState.unorderedList"
          @mousedown.prevent
          @click="toggleList('insertUnorderedList')"
        >
          <img :src="noNumIcon" alt="" aria-hidden="true" />
        </button>
      </div>

      <section class="text-editor-card">
        <div class="text-editor-field text-editor-field--body">
          <div
            ref="editorRef"
            class="text-editor-body"
            contenteditable="true"
            spellcheck="false"
            role="textbox"
            aria-multiline="true"
            data-placeholder="开始创造"
            @input="handleInput"
            @keydown="handleKeydown"
            @paste="handlePaste"
          ></div>
        </div>
      </section>
    </section>

    <div v-if="showLeaveDialog" class="dialog-overlay" @click.self="handleLeaveCancel">
      <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="leave-dialog-title">
        <h2 id="leave-dialog-title">当前内容尚未保存，是否继续？</h2>
        <p>点击取消可继续编辑，点击确认将离开当前页面。</p>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-btn--muted" @click="handleLeaveCancel">取消</button>
          <button type="button" class="dialog-btn dialog-btn--primary" @click="handleLeaveConfirm">确认</button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { createPlotDraft, getPlotItemById, upsertPlotItem } from '../lib/plotStore'
import { getRichTextFormatStateFromHtml, htmlToTextLines, normalizeRichTextHtml } from '../lib/richText'
import numIcon from '../assets/images/num_icon.png'
import noNumIcon from '../assets/images/no_num_icon.png'

const route = useRoute()
const router = useRouter()

const draft = reactive(createPlotDraft('idea'))
const loaded = ref(false)
const savedSnapshot = ref('')
const showLeaveDialog = ref(false)
const pendingNavigation = ref(null)
const allowRouteLeave = ref(false)
const editorRef = ref(null)
const toolbarState = reactive({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  orderedList: false,
  unorderedList: false,
})

function currentWorkId() {
  return String(route.query.workId || '')
}

const isDirty = computed(() => loaded.value && serializeDraft() !== savedSnapshot.value)

function serializeDraft() {
  return JSON.stringify({
    id: draft.id,
    kind: draft.kind,
    content: draft.content,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  })
}

function markSaved() {
  savedSnapshot.value = serializeDraft()
}

function getSelectionInsideEditor() {
  const el = editorRef.value
  const selection = window.getSelection?.()
  if (!el || !selection || selection.rangeCount === 0) return false
  const anchor = selection.anchorNode
  return Boolean(anchor && el.contains(anchor))
}

function refreshToolbarState() {
  const el = editorRef.value
  if (!el) return

  if (!getSelectionInsideEditor()) {
    Object.assign(toolbarState, getRichTextFormatStateFromHtml(el.innerHTML))
    return
  }

  toolbarState.bold = document.queryCommandState('bold')
  toolbarState.italic = document.queryCommandState('italic')
  toolbarState.underline = document.queryCommandState('underline')
  toolbarState.strikeThrough = document.queryCommandState('strikeThrough')
  toolbarState.orderedList = document.queryCommandState('insertOrderedList')
  toolbarState.unorderedList = document.queryCommandState('insertUnorderedList')
}

function syncEditorContent() {
  const el = editorRef.value
  if (!el) return
  el.innerHTML = draft.content || ''
  refreshToolbarState()
}

function syncDraftFromEditor() {
  const el = editorRef.value
  if (!el) return
  const normalized = normalizeRichTextHtml(el.innerHTML)
  draft.content = normalized
  if (!normalized) {
    el.innerHTML = ''
  }
  refreshToolbarState()
}

function loadDraft() {
  const id = String(route.params.id || '')
  const source = id ? getPlotItemById(currentWorkId(), id) : null
  if (source && source.kind === 'idea') {
    draft.id = source.id
    draft.kind = 'idea'
    draft.content = source.content || ''
    draft.createdAt = source.createdAt || draft.createdAt
    draft.updatedAt = source.updatedAt || draft.updatedAt
    loaded.value = true
    markSaved()
    nextTick(syncEditorContent)
    return
  }

  const nextDraft = createPlotDraft('idea')
  draft.id = id || draft.id || nextDraft.id
  draft.kind = 'idea'
  draft.content = ''
  draft.createdAt = draft.createdAt || nextDraft.createdAt
  draft.updatedAt = draft.updatedAt || nextDraft.updatedAt
  loaded.value = true
  markSaved()
  nextTick(syncEditorContent)
}

function saveDraft() {
  syncDraftFromEditor()
  const lines = htmlToTextLines(draft.content)
  const saved = upsertPlotItem(currentWorkId(), {
    id: draft.id,
    kind: 'idea',
    title: lines[0] || '',
    content: draft.content,
    createdAt: draft.createdAt,
    updatedAt: new Date().toISOString().slice(0, 10),
  })
  draft.content = saved.content
  draft.updatedAt = saved.updatedAt
  loaded.value = true
  markSaved()
  nextTick(syncEditorContent)
  refreshToolbarState()

  router.replace({
    name: 'idea',
    params: { id: saved.id },
    query: { workId: currentWorkId() },
  })
}

function applyFormat(command) {
  const el = editorRef.value
  if (!el) return
  el.focus()
  document.execCommand(command, false)
  syncDraftFromEditor()
  refreshToolbarState()
}

function toggleList(command) {
  const el = editorRef.value
  if (!el) return
  el.focus()
  document.execCommand(command, false)
  syncDraftFromEditor()
  refreshToolbarState()
}

function handleInput() {
  syncDraftFromEditor()
  refreshToolbarState()
}

function handleKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    saveDraft()
  }
}

function handlePaste(event) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  syncDraftFromEditor()
  refreshToolbarState()
}

function goBack() {
  const target = {
    name: 'plot-list',
    params: { id: String(route.query.workId || '') },
    query: { ...route.query },
  }
  if (isDirty.value) {
    pendingNavigation.value = target
    showLeaveDialog.value = true
    return
  }
  router.push(target)
}

function handleBack() {
  goBack()
}

function handleLeaveConfirm() {
  showLeaveDialog.value = false
  const target = pendingNavigation.value
  pendingNavigation.value = null
  if (target) {
    allowRouteLeave.value = true
    router.push(target)
    return
  }
  router.push({
    name: 'plot-list',
    params: { id: String(route.query.workId || '') },
    query: { ...route.query },
  })
}

function handleLeaveCancel() {
  showLeaveDialog.value = false
  pendingNavigation.value = null
}

watch(
  () => [route.params.id, route.query.workId],
  () => {
    loaded.value = false
    showLeaveDialog.value = false
    pendingNavigation.value = null
    loadDraft()
  },
  { immediate: true },
)

function handleSelectionChange() {
  refreshToolbarState()
}

onMounted(() => {
  document.addEventListener('selectionchange', handleSelectionChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', handleSelectionChange)
})

onBeforeRouteLeave((to) => {
  if (allowRouteLeave.value) {
    allowRouteLeave.value = false
    return true
  }
  if (!isDirty.value) return true
  pendingNavigation.value = to
  showLeaveDialog.value = true
  return false
})
</script>
