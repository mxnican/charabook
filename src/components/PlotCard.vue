<template>
  <article
    class="plot-card"
    :class="[
      `plot-card--${item.kind}`,
      { 'is-selected': selected, 'is-batch': batchMode },
    ]"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @pointerdown="startPress"
    @pointerup="endPress"
    @pointercancel="cancelPress"
    @pointerleave="cancelPress"
  >
    <div class="plot-card__body">
      <div class="plot-card__head">
        <span class="plot-card__dot" :class="`is-${item.kind}`" aria-hidden="true"></span>
        <span class="plot-card__tag">{{ item.kind === 'idea' ? '灵感' : '剧情' }}</span>
        <span v-if="batchMode" class="plot-card__check" :class="{ 'is-selected': selected }" aria-hidden="true">
          {{ selected ? '✓' : '' }}
        </span>
      </div>

      <h3 class="plot-card__title">{{ displayTitle }}</h3>
      <p class="plot-card__content">{{ previewContent }}</p>

      <div class="plot-card__meta">
        <span>{{ wordCount }}字</span>
        <span>{{ dateLabel }}</span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { countPlotWords, formatDateLabel, getContentBody, getContentHeadline } from '../lib/plotStore'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  batchMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['open', 'select', 'longpress'])

const pressTimer = ref(null)
const longPressTriggered = ref(false)

const displayTitle = computed(() => {
  const headline = getContentHeadline(props.item.content)
  if (headline) return headline
  const title = typeof props.item.title === 'string' ? props.item.title.trim() : ''
  return title || (props.item.kind === 'idea' ? '未命名灵感' : '未命名剧情')
})

const previewContent = computed(() => {
  const body = getContentBody(props.item.content)
  if (body) return body
  const content = typeof props.item.content === 'string' ? props.item.content.trim() : ''
  return content || (props.item.kind === 'idea' ? '点击记录下一个灵感片段。' : '点击补充这一段剧情的走向。')
})

const wordCount = computed(() => countPlotWords(props.item.content, props.item.title))
const dateLabel = computed(() => formatDateLabel(props.item.updatedAt || props.item.createdAt))

function startPress() {
  cancelPress()
  longPressTriggered.value = false
  pressTimer.value = window.setTimeout(() => {
    longPressTriggered.value = true
    emit('longpress', props.item.id)
  }, 480)
}

function endPress() {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value)
    pressTimer.value = null
  }
}

function cancelPress() {
  endPress()
}

function handleClick() {
  if (longPressTriggered.value) {
    longPressTriggered.value = false
    return
  }

  if (props.batchMode) {
    emit('select', props.item.id)
    return
  }

  emit('open', props.item.id)
}

onBeforeUnmount(cancelPress)
</script>
