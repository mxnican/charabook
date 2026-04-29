<template>
  <div v-if="open" class="more-menu" @click.self="$emit('close')">
    <div class="more-menu__panel">
      <button type="button" @click="$emit('batch-select')">批量选择</button>
      <button type="button" class="is-disabled" disabled>主题切换</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close', 'batch-select'])
</script>
