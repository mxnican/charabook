<template>
  <main class="plot-page">
    <header class="character-page__header">
      <button class="character-back" type="button" aria-label="返回" @click="goHome">←</button>
      <h1 class="character-title">{{ workTitle }}</h1>
      <button class="character-detail" type="button" @click="goDetail">详情</button>
    </header>

    <section class="plot-shell">
      <PlotTopBar
        :mode="mode"
        :search="search"
        :selected-count="selectedIds.length"
        :all-selected="mode === 'batch' && filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id))"
        @update:search="search = $event"
        @add="toggleAddMenu"
        @toggle-all="toggleAll"
      />

      <div v-if="showAddMenu" class="plot-add-menu__backdrop" @click.self="showAddMenu = false">
        <section class="plot-add-menu" role="menu" aria-label="新增内容类型">
          <button type="button" class="plot-add-menu__item plot-add-menu__item--idea" @click="createAndOpen('idea')">
            <strong>新增灵感记录</strong>
            <span>适合备忘、台词、设定和临时想法</span>
          </button>
          <button type="button" class="plot-add-menu__item plot-add-menu__item--plot" @click="createAndOpen('plot')">
            <strong>新增剧情</strong>
            <span>适合章节、桥段、转折和剧情草稿</span>
          </button>
        </section>
      </div>

      <PlotGrid
        :items="filteredItems"
        :selected-ids="selectedIds"
        :batch-mode="mode === 'batch'"
        @open="openItem"
        @select="toggleSelection"
        @longpress="handleLongPress"
      />

      <p v-if="emptyMessage" class="plot-page__empty">{{ emptyMessage }}</p>

      <PlotBatchToolbar
        :visible="mode === 'batch'"
        :has-selection="selectedIds.length > 0"
        @delete="deleteSelected"
        @cancel="exitBatchMode"
      />

      <div v-if="showDeleteDialog" class="dialog-overlay" @click.self="showDeleteDialog = false">
        <section class="dialog-card plot-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <h2 id="delete-title">确认删除选中的 {{ selectedIds.length }} 项？</h2>
          <div class="dialog-actions">
            <button type="button" class="dialog-btn dialog-btn--muted" @click="showDeleteDialog = false">取消</button>
            <button type="button" class="dialog-btn dialog-btn--primary" @click="confirmDelete">删除</button>
          </div>
        </section>
      </div>

      <WorkBottomNav active="plot" @select="handleNavSelect" />
    </section>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlotTopBar from '../components/PlotTopBar.vue'
import PlotGrid from '../components/PlotGrid.vue'
import PlotBatchToolbar from '../components/PlotBatchToolbar.vue'
import WorkBottomNav from '../components/WorkBottomNav.vue'
import { createPlotDraft, loadPlotItems, removePlotItems } from '../lib/plotStore'
import { getWorkById, touchWorkUpdatedAt } from '../lib/workbookStore'

const route = useRoute()
const router = useRouter()

const mode = ref('normal')
const search = ref('')
const selectedIds = ref([])
const showAddMenu = ref(false)
const showDeleteDialog = ref(false)
const workId = computed(() => String(route.params.id || route.query.workId || ''))
const items = ref(loadPlotItems(workId.value))

const workTitle = computed(() => {
  const work = getWorkById(workId.value)
  const queryTitle = String(route.query.workTitle || '').trim()
  return work?.title?.trim() || queryTitle || '未命名作品'
})

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  const base = [...items.value].sort((a, b) => {
    const left = `${a.updatedAt || a.createdAt || ''}-${a.createdAt || ''}`
    const right = `${b.updatedAt || b.createdAt || ''}-${b.createdAt || ''}`
    return right.localeCompare(left)
  })

  if (!q) return base

  return base.filter((item) => {
    const haystack = [item.title, item.content, item.kind === 'idea' ? '灵感' : '剧情']
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

const emptyMessage = computed(() => {
  if (filteredItems.value.length > 0) return ''
  if (!search.value.trim() && items.value.length === 0) return '还没有剧情或灵感，先新增一条吧。'
  return '没有找到符合条件的内容。'
})

function syncItems() {
  items.value = loadPlotItems(workId.value)
}

watch(
  () => [route.params.id, route.query.workId],
  () => {
    mode.value = 'normal'
    selectedIds.value = []
    showAddMenu.value = false
    showDeleteDialog.value = false
    syncItems()
  },
  { immediate: true },
)

function toggleAddMenu() {
  showAddMenu.value = !showAddMenu.value
}

function exitBatchMode() {
  mode.value = 'normal'
  selectedIds.value = []
}

function enterBatchMode(initialId = null) {
  mode.value = 'batch'
  if (initialId && !selectedIds.value.includes(initialId)) {
    selectedIds.value = [...selectedIds.value, initialId]
  }
}

function toggleSelection(id) {
  if (mode.value !== 'batch') return
  const exists = selectedIds.value.includes(id)
  selectedIds.value = exists
    ? selectedIds.value.filter((itemId) => itemId !== id)
    : [...selectedIds.value, id]
}

function handleLongPress(id) {
  enterBatchMode(id)
}

function toggleAll() {
  if (mode.value !== 'batch') return
  const filteredIds = filteredItems.value.map((item) => item.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.value.includes(id))
  selectedIds.value = allSelected
    ? selectedIds.value.filter((id) => !filteredIds.includes(id))
    : Array.from(new Set([...selectedIds.value, ...filteredIds]))
}

function goHome() {
  router.push({ name: 'home' })
}

function goDetail() {
  router.push({ name: 'work-detail', params: { id: workId.value } })
}

function openItem(id) {
  const item = items.value.find((entry) => entry.id === id)
  if (!item) return
  const target = item.kind === 'idea' ? 'idea' : 'plot-edit'
  router.push({
    name: target,
    params: { id: item.id },
    query: { workId: workId.value },
  })
}

function createAndOpen(kind) {
  showAddMenu.value = false
  const draft = createPlotDraft(kind)
  router.push({
    name: kind === 'idea' ? 'idea' : 'plot-edit',
    params: { id: draft.id },
    query: { workId: workId.value, draft: '1' },
  })
}

function deleteSelected() {
  if (!selectedIds.value.length) return
  showDeleteDialog.value = true
}

function confirmDelete() {
  items.value = removePlotItems(workId.value, selectedIds.value)
  touchWorkUpdatedAt(workId.value)
  selectedIds.value = []
  mode.value = 'normal'
  showDeleteDialog.value = false
}

function handleNavSelect(view) {
  if (view === 'character') {
    router.push({
      name: 'character',
      params: { id: workId.value },
      query: { ...route.query },
    })
  }
}
</script>
