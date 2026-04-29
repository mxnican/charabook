<template>
  <main class="home-view">
    <TopBar
      :mode="mode"
      :search="search"
      :selected-count="selectedIds.length"
      :all-selected="mode === 'batch' && filteredBooks.length > 0 && selectedIds.length === filteredBooks.length"
      @update:search="search = $event"
      @toggle-all="toggleAll"
    />

    <BookGrid
      :items="filteredBooks"
      :selected-ids="selectedIds"
      :batch-mode="mode === 'batch'"
      @open="openBook"
      @select="toggleSelection"
      @longpress="handleLongPress"
    />

    <p v-if="emptyMessage" class="home-view__empty">{{ emptyMessage }}</p>

    <BatchToolbar
      :visible="mode === 'batch'"
      :has-selection="selectedIds.length > 0"
      @delete="deleteSelected"
      @cancel="exitBatchMode"
    />

    <button v-if="mode !== 'batch'" class="fab" type="button" aria-label="新增" @click="createNewWork">+</button>

    <div v-if="showDeleteDialog" class="dialog-overlay" @click.self="cancelDelete">
      <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <h2 id="delete-dialog-title">当前选中的内容将被删除，是否继续？</h2>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-btn--muted" @click="cancelDelete">取消</button>
          <button type="button" class="dialog-btn dialog-btn--primary" @click="confirmDelete">确认</button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '../components/TopBar.vue'
import BookGrid from '../components/BookGrid.vue'
import BatchToolbar from '../components/BatchToolbar.vue'
import { loadWorks, removeWorks } from '../lib/workbookStore'

const router = useRouter()
const mode = ref('normal')
const search = ref('')
const selectedIds = ref([])
const books = ref(loadWorks())
const showDeleteDialog = ref(false)

const filteredBooks = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return books.value
  return books.value.filter((book) => book.title.toLowerCase().includes(q))
})

const hasAnyBooks = computed(() => books.value.length > 0)
const emptyMessage = computed(() => {
  if (filteredBooks.value.length > 0) return ''
  if (!search.value.trim() && !hasAnyBooks.value) return '创建你的第一个作品'
  return '没有找到符合条件的项目。'
})

function enterBatchMode(initialId = null) {
  mode.value = 'batch'
  selectedIds.value = initialId ? [initialId] : selectedIds.value
}

function exitBatchMode() {
  mode.value = 'normal'
  selectedIds.value = []
}

function toggleSelection(id) {
  if (mode.value !== 'batch') return
  const exists = selectedIds.value.includes(id)
  selectedIds.value = exists
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id]
}

function handleLongPress(id) {
  enterBatchMode(id)
}

function openBook(id) {
  router.push({ name: 'character', params: { id } })
}

function deleteSelected() {
  if (!selectedIds.value.length) return
  showDeleteDialog.value = true
}

function confirmDelete() {
  books.value = removeWorks(selectedIds.value)
  selectedIds.value = []
  mode.value = 'normal'
  showDeleteDialog.value = false
}

function cancelDelete() {
  showDeleteDialog.value = false
}

function toggleAll() {
  if (mode.value !== 'batch') return
  const allIds = filteredBooks.value.map((book) => book.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.value.includes(id))
  selectedIds.value = allSelected ? [] : [...allIds]
}

function createNewWork() {
  router.push({ name: 'work-detail', params: { id: 'new' } })
}
</script>
