<template>
  <section class="book-grid">
    <BookCard
      v-for="book in items"
      :key="book.id"
      :book="book"
      :selected="selectedIds.includes(book.id)"
      :batch-mode="batchMode"
      @open="$emit('open', $event)"
      @select="$emit('select', $event)"
      @longpress="$emit('longpress', $event)"
    />
  </section>
</template>

<script setup>
import BookCard from './BookCard.vue'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  selectedIds: {
    type: Array,
    default: () => [],
  },
  batchMode: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['open', 'select', 'longpress'])
</script>
