<template>
  <main class="character-page">
    <header class="character-page__header">
      <button class="character-back" type="button" aria-label="返回" @click="goPreviousPage">←</button>
      <h1 class="character-title">{{ workTitle }}</h1>
      <button class="character-detail" type="button" @click="goDetail">详情</button>
    </header>

    <header class="character-toolbar" aria-label="工具栏">
      <button class="character-toolbar__menu" type="button" aria-label="展开收起侧边栏" @click="toggleSidebar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>

      <div class="character-toolbar__spacer" aria-hidden="true"></div>

      <button
        type="button"
        class="character-save"
        :class="{ 'is-dirty': isDirty }"
        :disabled="!isDirty"
        aria-label="保存"
        @click="handleSave"
      >
        <img class="character-save__icon" :src="isDirty ? saveIcon : saveNoIcon" alt="" aria-hidden="true" />
      </button>

      <div ref="menuRef" class="character-menu">
        <button class="character-menu__trigger" type="button" aria-label="更多" :aria-expanded="menuOpen" @click="toggleMenu">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="5.5" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="18.5" r="1.6" />
          </svg>
        </button>

        <div v-if="menuOpen" class="character-menu__backdrop" @click="closeMenu"></div>
        <div v-if="menuOpen" class="character-menu__dropdown">
          <button type="button" class="character-menu__item character-menu__item--danger" @click="requestDeleteCharacter">
            删除角色
          </button>
        </div>
      </div>
    </header>

    <section class="character-shell" :class="{ 'is-sidebar-collapsed': !sidebarOpen }">
      <aside class="character-sidebar" :class="{ 'is-collapsed': !sidebarOpen }">
        <div class="character-sidebar__scroller">
          <button
            v-for="character in characters"
            :key="character.id"
            type="button"
            class="character-sidebar__item"
            :class="{
              'is-active': character.id === selectedCharacterId,
              'is-dragging': sidebarDrag.activeId === character.id && sidebarDrag.dragging,
              'is-drop-target': sidebarDrag.overId === character.id,
            }"
            :data-character-id="character.id"
            @click="handleSidebarItemClick(character.id)"
            @pointerdown="handleSidebarItemPointerDown(character.id, $event)"
          >
            <span class="character-sidebar__avatar" :style="sidebarAvatarStyle(character)">
              <svg v-if="!character.avatar" viewBox="0 0 24 24" aria-hidden="true" class="character-sidebar__placeholder">
                <path
                  d="M12 12.2c2.7 0 4.8-2.1 4.8-4.8S14.7 2.6 12 2.6 7.2 4.7 7.2 7.4 9.3 12.2 12 12.2Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                />
                <path
                  d="M5 21c.7-3.4 3.5-5.8 7-5.8s6.3 2.4 7 5.8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span class="character-sidebar__name">{{ characterLabel(character) }}</span>
          </button>
          <button type="button" class="character-sidebar__item character-sidebar__item--add" @click="requestAddCharacter">
            <span class="character-sidebar__avatar character-sidebar__avatar--add">+</span>
            <span class="character-sidebar__name">新增角色</span>
          </button>
        </div>
      </aside>

      <section class="character-workspace">
        <section class="character-main">
          <section class="character-hero">
            <div class="character-photo" role="button" tabindex="0" aria-label="角色头像，点击可更换" @click="openAvatarPicker" @keydown.enter.prevent="openAvatarPicker" @keydown.space.prevent="openAvatarPicker">
              <input ref="avatarInput" class="character-photo__input" type="file" accept="image/*" @change="handleAvatarChange" />
              <div class="character-photo__frame" :style="heroAvatarStyle">
                <svg v-if="!draft.avatar" viewBox="0 0 24 24" aria-hidden="true" class="character-photo__placeholder">
                  <path
                    d="M12 12.2c2.7 0 4.8-2.1 4.8-4.8S14.7 2.6 12 2.6 7.2 4.7 7.2 7.4 9.3 12.2 12 12.2Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                  />
                  <path
                    d="M5 21c.7-3.4 3.5-5.8 7-5.8s6.3 2.4 7 5.8"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                  />
                </svg>
              </div>
            </div>

            <div class="character-basic">
              <label class="character-basic__field">
                <span>姓名</span>
                <input v-model="draft.name" type="text" placeholder="请输入" />
              </label>
              <label class="character-basic__field">
                <span>性别</span>
                <input v-model="draft.gender" type="text" placeholder="请输入" />
              </label>
              <label class="character-basic__field">
                <span>发型</span>
                <input v-model="draft.hairstyle" type="text" placeholder="请输入" />
              </label>
              <label class="character-basic__field">
                <span>瞳色</span>
                <input v-model="draft.eyeColor" type="text" placeholder="请输入" />
              </label>
              <label class="character-basic__field">
                <span>身高</span>
                <input v-model="draft.height" type="text" placeholder="请输入" />
              </label>
            </div>
          </section>

          <section class="character-section">
            <div class="character-section__title">更多设定</div>
            <div class="character-settings">
              <div v-for="(setting, index) in draft.settings" :key="setting.id" class="character-setting-row">
                <textarea
                  v-model="setting.label"
                  class="character-setting-row__label"
                  rows="1"
                  placeholder="设定名称"
                  @input="resizeSettingField"
                ></textarea>
                <textarea
                  v-model="setting.value"
                  class="character-setting-row__value"
                  rows="1"
                  placeholder="请输入设定内容"
                  @input="resizeSettingField"
                ></textarea>
                <button type="button" class="character-setting-row__delete" aria-label="删除设定" @click="requestDeleteSetting(index)">
                  <img src="../assets/images/delete_icon.png" alt="" aria-hidden="true" />
                </button>
              </div>

              <button type="button" class="character-settings__add" @click="addSetting">
                <span>+</span>
                新增设定
              </button>
            </div>
          </section>

          <section class="character-section">
            <div class="character-section__title">人物经历</div>
            <textarea
              ref="experienceInput"
              v-model="draft.experience"
              class="character-experience"
              rows="1"
              placeholder="请输入"
              @input="resizeExperience"
            ></textarea>
          </section>
        </section>

        <WorkBottomNav active="character" @select="handleMenuSelect" />
      </section>
    </section>

    <div v-if="showUnsavedDialog" class="dialog-overlay" @click.self="cancelPendingAction">
      <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="unsaved-dialog-title">
        <h2 id="unsaved-dialog-title">当前内容尚未保存，是否继续？</h2>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-btn--muted" @click="cancelPendingAction">取消</button>
          <button type="button" class="dialog-btn dialog-btn--primary" @click="confirmPendingAction">确认</button>
        </div>
      </section>
    </div>

    <div v-if="showDeleteDialog" class="dialog-overlay" @click.self="cancelDelete">
      <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="delete-character-title">
        <h2 id="delete-character-title">当前角色将被删除，是否继续？</h2>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-btn--muted" @click="cancelDelete">取消</button>
          <button type="button" class="dialog-btn dialog-btn--primary" @click="confirmDelete">确认</button>
        </div>
      </section>
    </div>

    <div v-if="showSettingDeleteDialog" class="dialog-overlay" @click.self="cancelDeleteSetting">
      <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="delete-setting-title">
        <h2 id="delete-setting-title">当前设定将被删除，是否继续？</h2>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-btn--muted" @click="cancelDeleteSetting">取消</button>
          <button type="button" class="dialog-btn dialog-btn--primary" @click="confirmDeleteSetting">确认</button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import WorkBottomNav from '../components/WorkBottomNav.vue'
import {
  createEmptyCharacterDraft,
  ensureInitialCharacter,
  getCharacterById,
  loadCharacters,
  removeCharacter,
  saveCharacters,
  upsertCharacter,
} from '../lib/characterStore'
import { getWorkById, touchWorkUpdatedAt } from '../lib/workbookStore'
import saveIcon from '../assets/images/save.png'
import saveNoIcon from '../assets/images/save-no.png'

const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(true)
const menuOpen = ref(false)
const showUnsavedDialog = ref(false)
const showDeleteDialog = ref(false)
const showSettingDeleteDialog = ref(false)
const pendingAction = ref(null)
const pendingNavigation = ref(null)
const allowRouteLeave = ref(false)
const loaded = ref(false)
const menuRef = ref(null)
const characters = ref([])
const selectedCharacterId = ref('')
const savedSnapshot = ref('')
const settingDeleteIndex = ref(-1)
const avatarInput = ref(null)
const experienceInput = ref(null)
const sidebarDrag = reactive({
  activeId: '',
  pointerId: -1,
  pointerType: '',
  armed: false,
  dragging: false,
  suppressClick: false,
  overId: '',
  startY: 0,
  lastY: 0,
})

let sidebarDragTimer = null
let suppressClickResetTimer = null

const draft = reactive(createEmptyCharacterDraft())

const workId = computed(() => String(route.params.id || ''))

const workTitle = computed(() => {
  const work = getWorkById(workId.value)
  return work?.title?.trim() || '未命名作品'
})

const activeCharacter = computed(() => characters.value.find((character) => character.id === selectedCharacterId.value) || null)

const heroAvatarStyle = computed(() => {
  if (draft.avatar) {
    return { backgroundImage: `url("${draft.avatar}")` }
  }
  return {
    backgroundImage:
      'linear-gradient(180deg, rgba(218, 233, 255, 0.98) 0%, rgba(195, 214, 255, 0.96) 55%, rgba(248, 251, 255, 0.98) 100%)',
  }
})

const isDirty = computed(() => loaded.value && serializeDraft() !== savedSnapshot.value)

function serializeDraft() {
  return JSON.stringify({
    name: draft.name,
    avatar: draft.avatar,
    gender: draft.gender,
    hairstyle: draft.hairstyle,
    eyeColor: draft.eyeColor,
    height: draft.height,
    settings: draft.settings.map((item) => ({ label: item.label, value: item.value })),
    experience: draft.experience,
  })
}

function markSaved() {
  savedSnapshot.value = serializeDraft()
}

function characterLabel(character) {
  return character?.name?.trim() || '未命名'
}

function characterInitial(name) {
  const value = typeof name === 'string' ? name.trim() : ''
  if (!value) return '人'
  return value.slice(0, 1).toUpperCase()
}

function sidebarAvatarStyle(character) {
  if (character?.avatar) {
    return { backgroundImage: `url("${character.avatar}")` }
  }
  return {
    backgroundImage:
      'linear-gradient(180deg, rgba(216, 232, 255, 0.98) 0%, rgba(184, 207, 255, 0.9) 50%, rgba(245, 249, 255, 0.98) 100%)',
  }
}

function resetDraft(character) {
  draft.name = character?.name || ''
  draft.avatar = character?.avatar || ''
  draft.gender = character?.gender || ''
  draft.hairstyle = character?.hairstyle || ''
  draft.eyeColor = character?.eyeColor || ''
  draft.height = character?.height || ''
  draft.settings = Array.isArray(character?.settings) && character.settings.length > 0
    ? character.settings.map((item) => ({
        id: item.id || crypto.randomUUID(),
        label: item.label || '',
        value: item.value || '',
      }))
    : [
        { id: crypto.randomUUID(), label: '性格', value: '' },
        { id: crypto.randomUUID(), label: '职业', value: '' },
      ]
  draft.experience = character?.experience || character?.summary || ''
}

function loadWorkCharacters(nextCharacterId = '') {
  const nextCharacters = ensureInitialCharacter(workId.value)
  characters.value = nextCharacters
  const fallbackId = nextCharacters[0]?.id || ''
  const queryCharacterId = String(route.query.character || '')
  const targetId = nextCharacterId || queryCharacterId || fallbackId
  const found = nextCharacters.find((character) => character.id === targetId) || nextCharacters[0] || null
  if (!found) return
  selectedCharacterId.value = found.id
  resetDraft(found)
  loaded.value = true
  nextTick(resizeExperience)
  nextTick(resizeSettingFields)
  markSaved()
}

function syncQueryCharacter(characterId) {
  router.replace({
    name: 'character',
    params: { id: workId.value },
    query: { ...route.query, character: characterId },
  })
}

function selectCharacter(characterId) {
  const found = characters.value.find((character) => character.id === characterId)
  if (!found) return
  selectedCharacterId.value = found.id
  resetDraft(found)
  syncQueryCharacter(found.id)
  closeMenu()
  nextTick(resizeExperience)
  nextTick(resizeSettingFields)
  markSaved()
}

function requestSelectCharacter(characterId) {
  if (characterId === selectedCharacterId.value) return
  if (isDirty.value) {
    pendingAction.value = () => selectCharacter(characterId)
    showUnsavedDialog.value = true
    closeMenu()
    return
  }
  selectCharacter(characterId)
}

function clearSidebarDragTimer() {
  if (sidebarDragTimer !== null) {
    window.clearTimeout(sidebarDragTimer)
    sidebarDragTimer = null
  }
}

function scheduleSuppressClickReset() {
  if (suppressClickResetTimer !== null) {
    window.clearTimeout(suppressClickResetTimer)
  }
  suppressClickResetTimer = window.setTimeout(() => {
    sidebarDrag.suppressClick = false
    suppressClickResetTimer = null
  }, 250)
}

function resetSidebarDragState() {
  clearSidebarDragTimer()
  sidebarDrag.activeId = ''
  sidebarDrag.pointerId = -1
  sidebarDrag.pointerType = ''
  sidebarDrag.armed = false
  sidebarDrag.dragging = false
  sidebarDrag.overId = ''
  sidebarDrag.startY = 0
  sidebarDrag.lastY = 0
}

function saveSidebarOrder() {
  saveCharacters(workId.value, characters.value)
  touchWorkUpdatedAt(workId.value)
}

function moveCharacterBefore(activeId, beforeId) {
  const currentIndex = characters.value.findIndex((character) => character.id === activeId)
  if (currentIndex < 0) return

  const next = characters.value.slice()
  const [moving] = next.splice(currentIndex, 1)
  const targetIndex = beforeId
    ? next.findIndex((character) => character.id === beforeId)
    : next.length
  next.splice(targetIndex >= 0 ? targetIndex : next.length, 0, moving)
  characters.value = next
}

function updateSidebarDropTarget(clientY) {
  if (!sidebarDrag.activeId) return

  const items = Array.from(document.querySelectorAll('.character-sidebar__item[data-character-id]'))
    .filter((element) => element instanceof HTMLElement)
    .filter((element) => element.dataset.characterId && element.dataset.characterId !== sidebarDrag.activeId)

  let nextOverId = ''
  for (const element of items) {
    const rect = element.getBoundingClientRect()
    if (clientY < rect.top + rect.height / 2) {
      nextOverId = element.dataset.characterId || ''
      break
    }
  }

  sidebarDrag.overId = nextOverId
}

function handleSidebarItemPointerDown(characterId, event) {
  if (event.button !== 0) return
  clearSidebarDragTimer()

  sidebarDrag.activeId = characterId
  sidebarDrag.pointerId = event.pointerId
  sidebarDrag.pointerType = event.pointerType || ''
  sidebarDrag.armed = false
  sidebarDrag.dragging = false
  sidebarDrag.overId = ''
  sidebarDrag.startY = event.clientY
  sidebarDrag.lastY = event.clientY
  sidebarDrag.suppressClick = false

  const target = event.currentTarget
  if (target instanceof HTMLElement && typeof target.setPointerCapture === 'function') {
    target.setPointerCapture(event.pointerId)
  }

  if (sidebarDrag.pointerType === 'mouse') {
    return
  }

  sidebarDragTimer = window.setTimeout(() => {
    sidebarDrag.armed = true
    sidebarDrag.dragging = true
    sidebarDrag.suppressClick = true
    updateSidebarDropTarget(sidebarDrag.lastY)
  }, 420)
}

function handleSidebarDragPointerMove(event) {
  if (event.pointerId !== sidebarDrag.pointerId || !sidebarDrag.activeId) return

  sidebarDrag.lastY = event.clientY

  if (!sidebarDrag.armed) {
    const movedEnough = Math.abs(event.clientY - sidebarDrag.startY) > (sidebarDrag.pointerType === 'mouse' ? 4 : 8)

    if (sidebarDrag.pointerType === 'mouse' && movedEnough) {
      sidebarDrag.armed = true
      sidebarDrag.dragging = true
      sidebarDrag.suppressClick = true
      updateSidebarDropTarget(event.clientY)
      moveCharacterBefore(sidebarDrag.activeId, sidebarDrag.overId)
      return
    }

    if (sidebarDrag.pointerType !== 'mouse' && movedEnough) {
      clearSidebarDragTimer()
    }
    return
  }

  updateSidebarDropTarget(event.clientY)
  moveCharacterBefore(sidebarDrag.activeId, sidebarDrag.overId)
}

function finalizeSidebarDrag(commitOrder) {
  const wasDragging = sidebarDrag.dragging || sidebarDrag.armed
  if (commitOrder && wasDragging) {
    saveSidebarOrder()
    sidebarDrag.suppressClick = true
    scheduleSuppressClickReset()
  }
  resetSidebarDragState()
}

function handleSidebarDragPointerUp(event) {
  if (event.pointerId !== sidebarDrag.pointerId || !sidebarDrag.activeId) return
  finalizeSidebarDrag(true)
}

function handleSidebarItemClick(characterId) {
  if (sidebarDrag.suppressClick) {
    sidebarDrag.suppressClick = false
    return
  }
  requestSelectCharacter(characterId)
}

function createCharacter() {
  const next = upsertCharacter(workId.value, createEmptyCharacterDraft(characters.value.length))
  touchWorkUpdatedAt(workId.value)
  characters.value = loadCharacters(workId.value)
  selectedCharacterId.value = next.id
  resetDraft(next)
  syncQueryCharacter(next.id)
  closeMenu()
  nextTick(() => {
    resizeExperience()
    resizeSettingFields()
    markSaved()
  })
}

function requestAddCharacter() {
  if (isDirty.value) {
    pendingAction.value = createCharacter
    showUnsavedDialog.value = true
    closeMenu()
    return
  }
  createCharacter()
}

function saveCurrentCharacter() {
  const next = upsertCharacter(workId.value, {
    ...activeCharacter.value,
    id: selectedCharacterId.value,
    name: draft.name.trim(),
    avatar: draft.avatar,
    gender: draft.gender,
    hairstyle: draft.hairstyle,
    eyeColor: draft.eyeColor,
    height: draft.height,
    settings: draft.settings,
    experience: draft.experience,
    summary: draft.experience,
  })
  touchWorkUpdatedAt(workId.value)
  characters.value = loadCharacters(workId.value)
  selectedCharacterId.value = next.id
  resetDraft(next)
  nextTick(() => {
    resizeExperience()
    resizeSettingFields()
  })
  markSaved()
}

function handleSave() {
  saveCurrentCharacter()
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function openMenu() {
  menuOpen.value = true
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value ? closeMenu() : openMenu()
}

function handleDocumentPointerDown(event) {
  if (!menuOpen.value) return
  const menuEl = menuRef.value
  if (menuEl && !menuEl.contains(event.target)) {
    closeMenu()
  }
}

function requestDeleteCharacter() {
  closeMenu()
  if (isDirty.value) {
    pendingAction.value = () => {
      showDeleteDialog.value = true
    }
    showUnsavedDialog.value = true
    return
  }
  showDeleteDialog.value = true
}

function confirmDelete() {
  const removingId = selectedCharacterId.value
  const nextCharacters = removeCharacter(workId.value, removingId)
  touchWorkUpdatedAt(workId.value)
  characters.value = nextCharacters.length > 0 ? nextCharacters : [createEmptyCharacterDraft(0)]
  if (nextCharacters.length === 0) {
    upsertCharacter(workId.value, characters.value[0])
    characters.value = loadCharacters(workId.value)
  }
  const nextSelected = characters.value[0]
  selectedCharacterId.value = nextSelected.id
  resetDraft(nextSelected)
  syncQueryCharacter(nextSelected.id)
  showDeleteDialog.value = false
  nextTick(resizeExperience)
  nextTick(resizeSettingFields)
  markSaved()
}

function cancelDelete() {
  showDeleteDialog.value = false
}

function goPreviousPage() {
  router.push({ name: 'home' })
}

function goDetail() {
  router.push({ name: 'work-detail', params: { id: workId.value } })
}

function handleMenuSelect(view) {
  if (view === 'plot') {
    router.push({ name: 'plot-list', params: { id: workId.value }, query: { ...route.query } })
  }
}

function confirmPendingAction() {
  const action = pendingAction.value
  const navigation = pendingNavigation.value
  showUnsavedDialog.value = false
  pendingAction.value = null
  pendingNavigation.value = null
  if (navigation) {
    allowRouteLeave.value = true
    router.push(navigation)
    return
  }
  if (typeof action === 'function') action()
}

function cancelPendingAction() {
  showUnsavedDialog.value = false
  pendingAction.value = null
  pendingNavigation.value = null
}

function openAvatarPicker() {
  avatarInput.value?.click()
}

function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    draft.avatar = String(reader.result || '')
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

function resizeExperience() {
  const el = experienceInput.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function resizeSettingField(event) {
  const el = event?.target
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function resizeSettingFields() {
  document.querySelectorAll('.character-setting-row__label, .character-setting-row__value').forEach((el) => {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  })
}

function addSetting() {
  draft.settings = [
    ...draft.settings,
    { id: crypto.randomUUID(), label: '', value: '' },
  ]
  nextTick(resizeSettingFields)
}

function requestDeleteSetting(index) {
  settingDeleteIndex.value = index
  showSettingDeleteDialog.value = true
}

function confirmDeleteSetting() {
  if (settingDeleteIndex.value < 0) {
    showSettingDeleteDialog.value = false
    return
  }
  draft.settings = draft.settings.filter((_, index) => index !== settingDeleteIndex.value)
  settingDeleteIndex.value = -1
  showSettingDeleteDialog.value = false
}

function cancelDeleteSetting() {
  settingDeleteIndex.value = -1
  showSettingDeleteDialog.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown, true)
  document.addEventListener('pointermove', handleSidebarDragPointerMove, true)
  document.addEventListener('pointerup', handleSidebarDragPointerUp, true)
  document.addEventListener('pointercancel', handleSidebarDragPointerUp, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
  document.removeEventListener('pointermove', handleSidebarDragPointerMove, true)
  document.removeEventListener('pointerup', handleSidebarDragPointerUp, true)
  document.removeEventListener('pointercancel', handleSidebarDragPointerUp, true)
  clearSidebarDragTimer()
  if (suppressClickResetTimer !== null) {
    window.clearTimeout(suppressClickResetTimer)
  }
})

onBeforeRouteLeave((to) => {
  if (allowRouteLeave.value) {
    allowRouteLeave.value = false
    return true
  }
  if (!isDirty.value) return true
  pendingNavigation.value = {
    name: to.name || undefined,
    params: { ...to.params },
    query: { ...to.query },
    hash: to.hash,
  }
  pendingAction.value = null
  showUnsavedDialog.value = true
  return false
})

watch(
  () => route.params.id,
  () => {
    loaded.value = false
    pendingNavigation.value = null
    showUnsavedDialog.value = false
    showDeleteDialog.value = false
    showSettingDeleteDialog.value = false
    menuOpen.value = false
    loadWorkCharacters(String(route.query.character || ''))
  },
  { immediate: true },
)

watch(
  () => route.query.character,
  (characterId) => {
    if (!loaded.value) return
    const nextId = String(characterId || '')
    if (!nextId || nextId === selectedCharacterId.value) return
    if (isDirty.value) return
    const found = getCharacterById(workId.value, nextId)
    if (found) selectCharacter(found.id)
  },
)

watch(
  () => draft.experience,
  () => {
    if (!loaded.value) return
    nextTick(resizeExperience)
  },
)
</script>
