<template>
  <footer v-if="visible" class="plot-batch-toolbar">
    <button type="button" :disabled="!hasSelection" @click="$emit('delete')">删除</button>
    <button type="button" class="plot-batch-toolbar__cancel" @click="$emit('cancel')">取消</button>
  </footer>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  hasSelection: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['delete', 'cancel'])
</script>
