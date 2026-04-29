<template>
  <main class="text-editor-page">
    <section class="text-editor-shell">
      <header class="text-editor-topbar">
        <button class="text-editor-back" type="button" aria-label="返回" @click="goBack">←</button>
        <h1 class="text-editor-title">灵感记录</h1>
        <button class="text-editor-save" type="button" :disabled="!isDirty" @click="saveDraft">
          保存
        </button>
      </header>

      <section class="text-editor-card">
        <label class="text-editor-field text-editor-field--body">
          <span>内容</span>
          <textarea
            v-model="draft.content"
            placeholder="第一行会作为列表标题，后面继续写灵感、台词、设定或碎片想法"
          />
        </label>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createPlotDraft, getPlotItemById, upsertPlotItem } from '../lib/plotStore'

const route = useRoute()
const router = useRouter()

const draft = reactive(createPlotDraft('idea'))

const isDirty = computed(() => {
  const currentId = String(route.params.id || '')
  const source = currentId ? getPlotItemById(currentId) : null
  if (!source) {
    return draft.content.trim() !== ''
  }
  return draft.content !== (source.content || '')
})

function loadDraft() {
  const id = String(route.params.id || '')
  const source = id ? getPlotItemById(id) : null
  if (source && source.kind === 'idea') {
    draft.id = source.id
    draft.kind = 'idea'
    draft.content = source.content || ''
    draft.createdAt = source.createdAt || draft.createdAt
    draft.updatedAt = source.updatedAt || draft.updatedAt
    return
  }

  draft.id = id || draft.id || createPlotDraft('idea').id
  draft.kind = 'idea'
  draft.content = ''
  draft.createdAt = draft.createdAt || createPlotDraft('idea').createdAt
  draft.updatedAt = draft.updatedAt || createPlotDraft('idea').updatedAt
}

function saveDraft() {
  const saved = upsertPlotItem({
    id: draft.id,
    kind: 'idea',
    title: draft.content.split(/\r?\n/)[0].trim(),
    content: draft.content.trim(),
    createdAt: draft.createdAt,
    updatedAt: new Date().toISOString().slice(0, 10),
  })

  router.replace({
    name: 'idea',
    params: { id: saved.id },
    query: { workId: String(route.query.workId || '') },
  })
}

function goBack() {
  router.push({
    name: 'plot-list',
    params: { id: String(route.query.workId || '') },
    query: { ...route.query },
  })
}

watch(
  () => [route.params.id, route.query.workId],
  loadDraft,
  { immediate: true },
)
</script>
