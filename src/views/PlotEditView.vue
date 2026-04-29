<template>
  <main class="plot-editor-page">
    <section class="plot-editor-shell">
      <header class="plot-editor-topbar">
        <button class="plot-editor-back" type="button" aria-label="返回" @click="handleBack">←</button>
        <h1 class="plot-editor-title">剧情编辑</h1>
        <button class="plot-editor-save" type="button" :disabled="!isDirty" @click="saveDraft">
          保存
        </button>
      </header>

      <section class="plot-editor-board">
        <template v-if="draft.cards.length > 0">
          <article
            v-for="(card, index) in draft.cards"
            :key="card.id"
            class="plot-editor-card"
            :data-card-id="card.id"
            :class="[
              `plot-editor-card--${card.type}`,
              {
                'is-active': activeCardId === card.id,
                'is-dragging': dragState.isDragging && dragState.cardId === card.id,
                'is-drop-target': dragState.isDragging && dragState.overCardId === card.id,
              },
            ]"
            :style="cardStyle(card.type)"
            @pointerdown="handleCardPointerDown($event, card.id)"
          >
            <div class="plot-editor-card__left">
              <div class="plot-editor-card__index">{{ formatIndex(index + 1) }}</div>
              <div class="plot-editor-card__type">
                <img :src="getPlotCardType(card.type).icon" alt="" aria-hidden="true" class="plot-editor-card__icon" />
                <span class="plot-editor-card__label">{{ getPlotCardType(card.type).label }}</span>
              </div>
            </div>

            <div class="plot-editor-card__body">
              <textarea
                :ref="setCardRef(card.id)"
                v-model="card.content"
                class="plot-editor-card__textarea"
                rows="1"
                :placeholder="`点击输入${getPlotCardType(card.type).label}内容`"
                @input="handleCardInput(card.id)"
                @focus="activeCardId = card.id"
              ></textarea>
            </div>

            <button type="button" class="plot-editor-card__menu-trigger" @click.stop="toggleCardMenu(card.id)">
              ⋯
            </button>

            <div v-if="menuOpenCardId === card.id" class="plot-editor-card__menu" role="menu">
              <button type="button" class="plot-editor-card__menu-item plot-editor-card__menu-item--danger" @click="deleteCard(card.id)">
                删除
              </button>
            </div>
          </article>
        </template>

        <article v-else class="plot-editor-empty-card">
          <p class="plot-editor-empty-card__hint">点击下方按钮，选择类型开始编辑...</p>
        </article>
      </section>

      <section class="plot-editor-add-strip">
        <button
          v-for="typeMeta in cardTypeList"
          :key="typeMeta.id"
          type="button"
          class="plot-editor-add-strip__button"
          :style="typeButtonStyle(typeMeta)"
          @click="addCard(typeMeta.id)"
        >
          <img :src="typeMeta.icon" alt="" aria-hidden="true" />
          <span>{{ typeMeta.label }}</span>
        </button>
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
import {
  buildPlotBoardSummary,
  createPlotCard,
  extractPlotCardsFromItem,
  getPlotCardType,
  getPlotCardTypeList,
  movePlotCard,
} from '../lib/plotEditModel'
import { touchWorkUpdatedAt } from '../lib/workbookStore'

const route = useRoute()
const router = useRouter()

const draft = reactive(createPlotDraft('plot'))
draft.cards = []

const loaded = ref(false)
const savedSnapshot = ref('')
const showLeaveDialog = ref(false)
const pendingNavigation = ref(null)
const allowRouteLeave = ref(false)
const menuOpenCardId = ref('')
const activeCardId = ref('')
const dragState = reactive({
  pointerId: -1,
  cardId: '',
  overCardId: '',
  isDragging: false,
  startX: 0,
  startY: 0,
})
const dragPressTimer = ref(0)
const cardRefs = new Map()

const cardTypeList = getPlotCardTypeList()

function currentWorkId() {
  return String(route.query.workId || '')
}

const isDirty = computed(() => loaded.value && serializeDraft() !== savedSnapshot.value)

function serializeDraft() {
  return JSON.stringify({
    id: draft.id,
    kind: draft.kind,
    cards: draft.cards.map((card) => ({
      id: card.id,
      type: card.type,
      content: card.content,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    })),
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  })
}

function markSaved() {
  savedSnapshot.value = serializeDraft()
}

function setCardRef(id) {
  return (el) => {
    if (el) {
      cardRefs.set(id, el)
      resizeCardHeight(id)
    } else {
      cardRefs.delete(id)
    }
  }
}

function resizeCardHeight(id) {
  const el = cardRefs.get(id)
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function resizeAllCards() {
  draft.cards.forEach((card) => resizeCardHeight(card.id))
}

function focusCard(id) {
  const el = cardRefs.get(id)
  if (!el) return
  el.focus()
  resizeCardHeight(id)
}

function clearDragTimer() {
  if (dragPressTimer.value) {
    clearTimeout(dragPressTimer.value)
    dragPressTimer.value = 0
  }
}

function detachDragListeners() {
  window.removeEventListener('pointermove', handleWindowPointerMove)
  window.removeEventListener('pointerup', handleWindowPointerUp)
  window.removeEventListener('pointercancel', handleWindowPointerCancel)
}

function resetDragState() {
  clearDragTimer()
  detachDragListeners()
  dragState.pointerId = -1
  dragState.cardId = ''
  dragState.overCardId = ''
  dragState.isDragging = false
  menuOpenCardId.value = ''
}

function startDragging(cardId) {
  dragState.isDragging = true
  dragState.overCardId = cardId
  menuOpenCardId.value = ''
  activeCardId.value = cardId
}

function getCardElementFromPoint(clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY)
  if (!(element instanceof HTMLElement)) return null
  return element.closest('.plot-editor-card')
}

function moveCardToIndex(cardId, targetIndex) {
  draft.cards = movePlotCard(draft.cards, cardId, targetIndex)
}

function handleCardPointerDown(event, cardId) {
  if (typeof event.button === 'number' && event.button !== 0) return
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.closest('.plot-editor-card__menu-trigger') || target.closest('.plot-editor-card__menu')) {
    return
  }

  clearDragTimer()
  dragState.pointerId = event.pointerId
  dragState.cardId = cardId
  dragState.overCardId = cardId
  dragState.isDragging = false
  dragState.startX = event.clientX
  dragState.startY = event.clientY

  window.addEventListener('pointermove', handleWindowPointerMove)
  window.addEventListener('pointerup', handleWindowPointerUp)
  window.addEventListener('pointercancel', handleWindowPointerCancel)

  dragPressTimer.value = window.setTimeout(() => {
    if (dragState.pointerId === event.pointerId && dragState.cardId === cardId) {
      startDragging(cardId)
    }
  }, 280)
}

function handleWindowPointerMove(event) {
  if (event.pointerId !== dragState.pointerId) return

  if (!dragState.isDragging) {
    const offsetX = Math.abs(event.clientX - dragState.startX)
    const offsetY = Math.abs(event.clientY - dragState.startY)
    if (Math.max(offsetX, offsetY) > 8) {
      resetDragState()
    }
    return
  }

  event.preventDefault()
  const targetCard = getCardElementFromPoint(event.clientX, event.clientY)
  const targetId = targetCard?.dataset.cardId || ''
  if (!targetId || targetId === dragState.cardId) return

  const targetIndex = draft.cards.findIndex((card) => card.id === targetId)
  if (targetIndex < 0) return

  moveCardToIndex(dragState.cardId, targetIndex)
  dragState.overCardId = targetId
}

function handleWindowPointerUp(event) {
  if (event.pointerId !== dragState.pointerId) return
  resetDragState()
}

function handleWindowPointerCancel(event) {
  if (event.pointerId !== dragState.pointerId) return
  resetDragState()
}

function formatIndex(value) {
  return String(value).padStart(2, '0')
}

function syncMenuState() {
  if (menuOpenCardId.value && !draft.cards.some((card) => card.id === menuOpenCardId.value)) {
    menuOpenCardId.value = ''
  }
}

function loadDraft() {
  resetDragState()
  const id = String(route.params.id || '')
  const source = id ? getPlotItemById(currentWorkId(), id) : null
  if (source && source.kind === 'plot') {
    draft.id = source.id
    draft.kind = 'plot'
    draft.cards = extractPlotCardsFromItem(source)
    draft.createdAt = source.createdAt || draft.createdAt
    draft.updatedAt = source.updatedAt || draft.updatedAt
    activeCardId.value = draft.cards[0]?.id || ''
    loaded.value = true
    markSaved()
    nextTick(() => {
      resizeAllCards()
      syncMenuState()
    })
    return
  }

  const nextDraft = createPlotDraft('plot')
  draft.id = id || nextDraft.id
  draft.kind = 'plot'
  draft.cards = []
  draft.createdAt = nextDraft.createdAt
  draft.updatedAt = nextDraft.updatedAt
  activeCardId.value = ''
  loaded.value = true
  markSaved()
  nextTick(() => {
    resizeAllCards()
    syncMenuState()
  })
}

function addCard(type) {
  const card = createPlotCard(type, draft.cards.length)
  draft.cards.push(card)
  menuOpenCardId.value = ''
  activeCardId.value = card.id
  loaded.value = true
  nextTick(() => {
    resizeCardHeight(card.id)
    focusCard(card.id)
  })
}

function deleteCard(cardId) {
  if (dragState.cardId === cardId || dragState.overCardId === cardId) {
    resetDragState()
  }
  draft.cards = draft.cards.filter((card) => card.id !== cardId)
  cardRefs.delete(cardId)
  if (menuOpenCardId.value === cardId) {
    menuOpenCardId.value = ''
  }
  if (activeCardId.value === cardId) {
    activeCardId.value = draft.cards[0]?.id || ''
  }
  loaded.value = true
  nextTick(resizeAllCards)
}

function toggleCardMenu(cardId) {
  menuOpenCardId.value = menuOpenCardId.value === cardId ? '' : cardId
}

function typeButtonStyle(typeMeta) {
  return {
    '--plot-type-bg': typeMeta.background,
    '--plot-type-border': typeMeta.border,
    '--plot-type-text': typeMeta.text,
  }
}

function cardStyle(type) {
  const meta = getPlotCardType(type)
  return {
    '--plot-card-bg': meta.background,
    '--plot-card-border': meta.border,
    '--plot-card-text': meta.text,
  }
}

function handleCardInput(cardId) {
  resizeCardHeight(cardId)
}

function saveDraft() {
  resetDragState()
  const summary = buildPlotBoardSummary(draft.cards)
  const saved = upsertPlotItem(currentWorkId(), {
    id: draft.id,
    kind: 'plot',
    title: summary.title,
    content: summary.content,
    cards: draft.cards,
    createdAt: draft.createdAt,
    updatedAt: new Date().toISOString().slice(0, 10),
  })
  draft.id = saved.id
  draft.kind = 'plot'
  draft.cards = extractPlotCardsFromItem(saved)
  draft.createdAt = saved.createdAt
  draft.updatedAt = saved.updatedAt
  activeCardId.value = draft.cards[0]?.id || ''
  touchWorkUpdatedAt(currentWorkId())
  loaded.value = true
  markSaved()
  nextTick(() => {
    resizeAllCards()
    syncMenuState()
  })

  router.replace({
    name: 'plot-edit',
    params: { id: saved.id },
    query: { workId: currentWorkId() },
  })
}

function goBack() {
  const target = {
    name: 'plot-list',
    params: { id: currentWorkId() },
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
    params: { id: currentWorkId() },
    query: { ...route.query },
  })
}

function handleLeaveCancel() {
  showLeaveDialog.value = false
  pendingNavigation.value = null
}

function closeMenusOnDocumentClick(event) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.closest('.plot-editor-card__menu') || target.closest('.plot-editor-card__menu-trigger')) return
  menuOpenCardId.value = ''
}

watch(
  () => [route.params.id, route.query.workId],
  () => {
    resetDragState()
    loaded.value = false
    showLeaveDialog.value = false
    pendingNavigation.value = null
    menuOpenCardId.value = ''
    loadDraft()
  },
  { immediate: true },
)

watch(
  () => draft.cards.map((card) => card.id).join(','),
  () => {
    syncMenuState()
  },
)

onBeforeUnmount(() => {
  resetDragState()
  document.removeEventListener('click', closeMenusOnDocumentClick)
})

onMounted(() => {
  document.addEventListener('click', closeMenusOnDocumentClick)
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
