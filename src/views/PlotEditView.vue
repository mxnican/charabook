<template>
  <main class="text-editor-page">
    <section class="text-editor-shell">
      <header class="text-editor-topbar">
        <button class="text-editor-back" type="button" aria-label="返回" @click="goBack">←</button>
        <h1 class="text-editor-title">剧情编辑</h1>
        <button class="text-editor-save" type="button" :disabled="!isDirty" @click="saveDraft">
          保存
        </button>
      </header>

      <section class="text-editor-card text-editor-card--plot">
        <label class="text-editor-field text-editor-field--body">
          <span>内容</span>
          <textarea
            v-model="draft.content"
            placeholder="第一行会作为列表标题，后面继续写这一章的走向、冲突和转折"
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

const draft = reactive(createPlotDraft('plot'))

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
  if (source && source.kind === 'plot') {
    draft.id = source.id
    draft.kind = 'plot'
    draft.content = source.content || ''
    draft.createdAt = source.createdAt || draft.createdAt
    draft.updatedAt = source.updatedAt || draft.updatedAt
    return
  }

  const nextDraft = createPlotDraft('plot')
  draft.id = id || nextDraft.id
  draft.kind = 'plot'
  draft.content = ''
  draft.createdAt = nextDraft.createdAt
  draft.updatedAt = nextDraft.updatedAt
}

function saveDraft() {
  const saved = upsertPlotItem({
    id: draft.id,
    kind: 'plot',
    title: draft.content.split(/\r?\n/)[0].trim(),
    content: draft.content.trim(),
    createdAt: draft.createdAt,
    updatedAt: new Date().toISOString().slice(0, 10),
  })

  router.replace({
    name: 'plot-edit',
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
