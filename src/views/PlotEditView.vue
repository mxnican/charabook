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
                'is-menu-open': menuOpenCardId === card.id,
              },
            ]"
            :style="cardStyle(card.type)"
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
              <button
                type="button"
                class="plot-editor-card__menu-item"
                :disabled="!canMoveCardByOffset(card.id, -1)"
                @click="moveCardByOffset(card.id, -1)"
              >
                上移
              </button>
              <button
                type="button"
                class="plot-editor-card__menu-item"
                :disabled="!canMoveCardByOffset(card.id, 1)"
                @click="moveCardByOffset(card.id, 1)"
              >
                下移
              </button>
            </div>
          </article>
        </template>

        <article v-else class="plot-editor-empty-card">
          <p class="plot-editor-empty-card__hint">点击下方按钮，选择类型开始编辑。</p>
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
  movePlotCardByOffset,
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

function formatIndex(value) {
  return String(value).padStart(2, '0')
}

function closeCardMenu() {
  menuOpenCardId.value = ''
}

function syncMenuState() {
  if (menuOpenCardId.value && !draft.cards.some((card) => card.id === menuOpenCardId.value)) {
    menuOpenCardId.value = ''
  }
}

function loadDraft() {
  closeCardMenu()
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
  closeCardMenu()
  activeCardId.value = card.id
  loaded.value = true
  nextTick(() => {
    resizeCardHeight(card.id)
    focusCard(card.id)
  })
}

function deleteCard(cardId) {
  draft.cards = draft.cards.filter((card) => card.id !== cardId)
  cardRefs.delete(cardId)
  closeCardMenu()
  if (activeCardId.value === cardId) {
    activeCardId.value = draft.cards[0]?.id || ''
  }
  loaded.value = true
  nextTick(resizeAllCards)
}

function toggleCardMenu(cardId) {
  menuOpenCardId.value = menuOpenCardId.value === cardId ? '' : cardId
}

function canMoveCardByOffset(cardId, offset) {
  const index = draft.cards.findIndex((card) => card.id === cardId)
  if (index < 0 || !Number.isFinite(offset)) return false
  const targetIndex = index + offset
  return targetIndex >= 0 && targetIndex < draft.cards.length
}

function moveCardByOffset(cardId, offset) {
  const nextCards = movePlotCardByOffset(draft.cards, cardId, offset)
  const orderChanged = nextCards.some((card, index) => card.id !== draft.cards[index]?.id)
  closeCardMenu()
  if (!orderChanged) return false
  draft.cards = nextCards
  activeCardId.value = cardId
  loaded.value = true
  nextTick(resizeAllCards)
  return true
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

function persistDraft({ syncRoute = false } = {}) {
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
  touchWorkUpdatedAt(currentWorkId())
  loaded.value = true
  markSaved()

  if (syncRoute) {
    router.replace({
      name: 'plot-edit',
      params: { id: saved.id },
      query: { workId: currentWorkId() },
    })
  }

  return saved
}

function saveDraft() {
  closeCardMenu()
  const saved = persistDraft({ syncRoute: true })
  activeCardId.value = draft.cards[0]?.id || ''
  nextTick(() => {
    resizeAllCards()
    syncMenuState()
  })
  return saved
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
  closeCardMenu()
}

watch(
  () => [route.params.id, route.query.workId],
  () => {
    loaded.value = false
    showLeaveDialog.value = false
    pendingNavigation.value = null
    closeCardMenu()
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
