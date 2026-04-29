<template>
  <header class="topbar">
    <div v-if="mode === 'normal'" class="topbar__search">
      <label class="search-box">
        <input
          :value="search"
          type="search"
          placeholder="搜索作品名"
          @input="$emit('update:search', $event.target.value)"
        />
      </label>
    </div>

    <div v-else class="topbar__batch">
      <button class="batch-action" type="button" @click="$emit('toggle-all')">{{ allSelected ? '取消全选' : '全选' }}</button>
      <h1>请选择项目</h1>
      <span class="batch-count">{{ selectedCount }} 项</span>
    </div>
  </header>
</template>

<script setup>
defineProps({
  mode: {
    type: String,
    required: true,
  },
  search: {
    type: String,
    default: '',
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
  allSelected: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:search', 'cancel-batch', 'toggle-all'])
</script>
