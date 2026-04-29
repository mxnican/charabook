<template>
  <section class="plot-grid">
    <PlotCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      :selected="selectedIds.includes(item.id)"
      :batch-mode="batchMode"
      @open="$emit('open', $event)"
      @select="$emit('select', $event)"
      @longpress="$emit('longpress', $event)"
    />
  </section>
</template>

<script setup>
import PlotCard from './PlotCard.vue'

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
