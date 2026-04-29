<template>
  <header class="plot-topbar" :class="{ 'is-batch': mode !== 'normal' }">
    <template v-if="mode === 'normal'">
      <label class="plot-search">
        <input
          :value="search"
          type="search"
          placeholder="搜索剧情标题或关键词"
          @input="$emit('update:search', $event.target.value)"
        />
        <button
          v-if="search"
          class="plot-search__clear"
          type="button"
          aria-label="清除搜索"
          @click="$emit('update:search', '')"
        >
          ×
        </button>
      </label>

      <button class="plot-add" type="button" aria-label="新增" @click="$emit('add')">+</button>
    </template>

    <template v-else>
      <button class="plot-batch__action" type="button" @click="$emit('toggle-all')">
        {{ allSelected ? '取消全选' : '全选' }}
      </button>
      <h1 class="plot-batch__title">已选择 {{ selectedCount }} 项</h1>
    </template>
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

defineEmits(['update:search', 'add', 'toggle-all'])
</script>
