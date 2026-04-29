<template>
  <main class="work-detail-page">
    <section class="work-detail-shell">
      <button class="detail-back" type="button" aria-label="返回" @click="handleBack">←</button>

      <button class="detail-save" type="button" :class="{ 'is-dirty': isDirty }" @click="handleSave">
        保存
      </button>

      <div class="work-detail-hero">
        <div
          class="work-detail-cover"
          :class="{ 'has-image': Boolean(work.cover) }"
          :style="coverStyle"
          role="button"
          tabindex="0"
          aria-label="作品封面，点击可更换"
          @click="openUploader"
          @keydown.enter.prevent="openUploader"
          @keydown.space.prevent="openUploader"
        >
          <input ref="fileInput" class="cover-input" type="file" accept="image/*" @change="handleCoverChange" />
          <button v-if="!work.cover" class="cover-upload" type="button" aria-label="上传封面" @click.stop="openUploader">
            +
          </button>
        </div>

        <div class="work-detail-meta">
          <textarea
            ref="titleInput"
            v-model="draft.title"
            class="work-title"
            spellcheck="false"
            aria-label="作品名称"
            rows="1"
            placeholder="未命名作品"
            @input="handleTitleInput"
          ></textarea>
          <div class="work-created">
            <span>创建时间：</span>
            <strong>{{ work.createdAt }}</strong>
          </div>
          <div class="work-created work-created--updated">
            <span>最近更新：</span>
            <strong>{{ updatedAtLabel }}</strong>
          </div>
        </div>
      </div>

      <section class="work-detail-intro">
        <div class="section-heading">
          <h2>作品简介</h2>
        </div>
        <textarea
          ref="introInput"
          v-model="draft.intro"
          class="work-intro-text"
          rows="1"
          placeholder="请输入"
          @input="handleIntroInput"
        ></textarea>
      </section>
    </section>

    <div v-if="showLeaveDialog" class="dialog-overlay" @click.self="handleLeaveCancel">
      <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="leave-dialog-title">
        <h2 id="leave-dialog-title">当前内容尚未保存，是否退出？</h2>
        <p>点击取消可继续编辑，点击确认将退出当前页面。</p>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-btn--muted" @click="handleLeaveCancel">取消</button>
          <button type="button" class="dialog-btn dialog-btn--primary" @click="handleLeaveConfirm">确认</button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createEmptyWorkDraft, getWorkById, getCoverForWork, upsertWork } from '../lib/workbookStore'

const route = useRoute()
const router = useRouter()
const fileInput = ref(null)
const titleInput = ref(null)
const introInput = ref(null)

const work = reactive({
  id: '',
  title: '',
  createdAt: '',
  coverTheme: 0,
  intro: '',
  cover: '',
})

const draft = reactive({
  title: '',
  intro: '',
})

const loaded = ref(false)
const savedSnapshot = ref('')
const showLeaveDialog = ref(false)

const coverStyle = computed(() => {
  const cover = getCoverForWork(work)
  if (!work.cover) return { backgroundImage: cover }
  return { backgroundImage: `url("${work.cover}")` }
})

const updatedAtLabel = computed(() => work.updatedAt || '--')

const isDirty = computed(() => serializeDraft() !== savedSnapshot.value)

function serializeDraft() {
  return JSON.stringify({
    title: draft.title,
    intro: draft.intro,
    cover: work.cover,
    coverTheme: work.coverTheme,
  })
}

function markSaved() {
  savedSnapshot.value = serializeDraft()
}

function resizeTitle() {
  const el = titleInput.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function resizeIntro() {
  const el = introInput.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function loadWork(id) {
  if (!id || id === 'new') {
    Object.assign(work, createEmptyWorkDraft())
    draft.title = work.title
    draft.intro = work.intro
    loaded.value = true
    markSaved()
    nextTick(resizeTitle)
    nextTick(resizeIntro)
    return
  }

  const found = getWorkById(id)
  if (!found) {
    router.replace({ name: 'home' })
    return
  }

  Object.assign(work, found)
  draft.title = found.title || ''
  draft.intro = found.intro || ''
  loaded.value = true
  markSaved()
  nextTick(resizeTitle)
  nextTick(resizeIntro)
}

function saveCurrent() {
  if (!draft.title.trim() && !draft.intro.trim() && !work.cover) {
    markSaved()
    return
  }

  const next = upsertWork({
    ...work,
    title: draft.title.trim(),
    intro: draft.intro,
  })
  Object.assign(work, next)
  draft.title = next.title
  draft.intro = next.intro
  markSaved()
  nextTick(resizeTitle)
  nextTick(resizeIntro)
}

function handleSave() {
  saveCurrent()
}

function handleTitleInput() {
  resizeTitle()
}

function handleIntroInput() {
  resizeIntro()
}

function handleBack() {
  if (isDirty.value) {
    showLeaveDialog.value = true
    return
  }
  goPreviousPage()
}

function handleLeaveConfirm() {
  showLeaveDialog.value = false
  goPreviousPage()
}

function handleLeaveCancel() {
  showLeaveDialog.value = false
}

function goPreviousPage() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push({ name: 'home' })
}

function openUploader() {
  fileInput.value?.click()
}

function handleCoverChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    work.cover = String(reader.result || '')
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

watch(
  () => route.params.id,
  (id) => {
    loaded.value = false
    showLeaveDialog.value = false
    loadWork(String(id || ''))
  },
  { immediate: true }
)

watch(
  () => draft.title,
  () => {
    if (!loaded.value) return
    nextTick(resizeTitle)
  }
)

watch(
  () => draft.intro,
  () => {
    if (!loaded.value) return
    nextTick(resizeIntro)
  }
)
</script>
