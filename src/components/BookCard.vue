<template>
  <article
    class="book-card"
    :class="{ 'is-selected': selected, 'is-batch': batchMode }"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @pointerdown="startPress"
    @pointerup="endPress"
    @pointercancel="cancelPress"
    @pointerleave="cancelPress"
  >
    <div class="book-card__cover" :style="coverStyle">
      <span v-if="batchMode" class="book-card__check" :class="{ 'is-selected': selected }">
        <span v-if="selected">✓</span>
      </span>
    </div>
    <h3>{{ displayTitle }}</h3>
    <p class="book-card__date">{{ displayDate }}</p>
  </article>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const DEFAULT_COVERS = [
  'linear-gradient(180deg, #dff0ff 0%, #bedbff 48%, #f8fbff 100%)',
  'linear-gradient(180deg, #e6f7ff 0%, #d2ecff 46%, #f5fbff 100%)',
  'linear-gradient(180deg, #dbe9ff 0%, #c5d7ff 44%, #f6f8ff 100%)',
]

const props = defineProps({
  book: {
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

const coverStyle = computed(() => ({
  backgroundImage: resolveCover(props.book.cover, props.book.coverTheme, props.book.id),
}))

const displayTitle = computed(() => {
  const title = typeof props.book.title === 'string' ? props.book.title.trim() : ''
  return title || '未命名作品'
})

const displayDate = computed(() => formatDateLabel(props.book.updatedAt || props.book.createdAt))

function resolveCover(cover, coverTheme, id) {
  if (cover) {
    return cover.startsWith('linear-gradient') || cover.startsWith('radial-gradient')
      ? cover
      : `url("${cover}")`
  }
  if (Number.isInteger(coverTheme)) {
    return DEFAULT_COVERS[((coverTheme % DEFAULT_COVERS.length) + DEFAULT_COVERS.length) % DEFAULT_COVERS.length]
  }
  const index = Number(id || 0) % DEFAULT_COVERS.length
  return DEFAULT_COVERS[index]
}

function formatDateLabel(dateString) {
  if (typeof dateString !== 'string' || !dateString) return ''
  return dateString.replace(/-/g, '/')
}

function startPress() {
  cancelPress()
  longPressTriggered.value = false
  pressTimer.value = window.setTimeout(() => {
    longPressTriggered.value = true
    emit('longpress', props.book.id)
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
    emit('select', props.book.id)
    return
  }

  emit('open', props.book.id)
}

onBeforeUnmount(cancelPress)
</script>
