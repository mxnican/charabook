<template>
  <nav class="work-bottom-nav" aria-label="页面菜单">
    <button
      type="button"
      class="work-bottom-nav__item"
      :class="{ 'is-active': active === 'character' }"
      @click="select('character')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" class="work-bottom-nav__icon">
        <path
          d="M12 12.4c2.9 0 5.2-2.3 5.2-5.2S14.9 2 12 2 6.8 4.3 6.8 7.2 9.1 12.4 12 12.4Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
        />
        <path
          d="M4.8 21c.8-3.6 3.9-6.1 7.2-6.1s6.4 2.5 7.2 6.1"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
        />
      </svg>
      <span>人设</span>
    </button>

    <button
      type="button"
      class="work-bottom-nav__item"
      :class="{ 'is-active': active === 'plot' }"
      @click="select('plot')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" class="work-bottom-nav__icon">
        <path
          d="M6 5.5h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
        />
        <path d="M8 9h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
        <path d="M8 12h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
        <path d="M8 15h5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
      </svg>
      <span>剧情</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  active: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['select'])

function select(view) {
  emit('select', view)
}
</script>
