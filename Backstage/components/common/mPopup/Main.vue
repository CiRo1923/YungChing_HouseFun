<script setup>
import '@css/_modules/common/mPopup/variables.css'
import '@css/_modules/common/mPopup/common.css'

const popup = usePopupStore()
const { alertData, confirmData, customData, apiPromiseData } = storeToRefs(popup)
const { onReset } = usePopupActions()

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const isShowOverlay = ref(false)
const isShowPopup = ref(false)

const isOpen = computed(() => keyID.value && props.id === keyID.value)
const keyID = computed(
  () => alertData.value.id || confirmData.value.id || customData.value.id || apiPromiseData.value.id
)

const hasExistClose = computed(() => {
  const alertClose = keyID.value === 'alertSystem' ? alertData.value.hasExistClose : false
  const confirmClose = keyID.value === 'confirmSystem' ? confirmData.value.hasExistClose : false
  const customClose =
    keyID.value !== 'alertSystem' &&
    keyID.value !== 'confirmSystem' &&
    keyID.value !== 'apiPromiseSystem'
      ? customData.value.hasExistClose
      : false
  const awaitClose = keyID.value === 'apiPromiseSystem' ? apiPromiseData.value.hasExistClose : null

  return alertClose || confirmClose || customClose || awaitClose
})

const title = computed(
  () => alertData.value.title || confirmData.value.title || customData.value.title
)

const icon = computed(() => alertData.value.icon || confirmData.value.icon || customData.value.icon)

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    icon: '',
    headerTitle: '',
    headerTools: '',
    body: '',
    footer: '',
    note: '',
    ...props.setClass,
  }
})

// container 退場完成後才收遮罩。
// 必須確認「確實已關閉」:若在退場途中又被重新開啟(A → B → 上一步 → A),
// 此時 isOpen 已回 true,遮罩不能收掉。
const onAfterLeave = () => {
  if (!isOpen.value) isShowOverlay.value = false
}

const onExistClose = () => {
  onReset()
}

// 開啟一律由這裡明確驅動,不靠 overlay 的 @enter。
// 舊版靠 @enter 點亮 isShowPopup,一旦遮罩還在(重開時 v-if 沒有 false → true)
// 就不會觸發,isShowPopup 永遠停在 false,該 popup 從此開不起來。
watch(
  isOpen,
  async (open) => {
    if (!open) {
      // 先收 container,遮罩等它的 @afterLeave
      isShowPopup.value = false
      return
    }

    isShowOverlay.value = true

    // 等遮罩掛上,內層 Transition 才存在;之後的 isShowPopup 切換才會播 enter
    await nextTick()

    // nextTick 之間可能又被關掉(快速開關),故再確認一次
    if (isOpen.value) isShowPopup.value = true
  },
  { immediate: true }
)
</script>

<template>
  <Transition name="popup-overlay">
    <div class="m-popup --zoom" :class="setClass.main" v-if="isShowOverlay">
      <Transition name="popup-zoom" @afterLeave="onAfterLeave">
        <div class="m-popup-container" :class="setClass.container" v-if="isShowPopup">
          <div class="m-popup-header" :class="setClass.header" v-if="title || $slots.headerTools">
            <slot name="header">
              <p class="m-popup-title" :class="setClass.headerTitle">
                <CommonSvgIcon
                  :icon="icon"
                  class="m-popup-icon"
                  :class="[setClass.icon, { '--defaule-color': !setClass.icon }]"
                  v-if="icon"
                />
                <b class="font-medium" v-html="title" />
              </p>
            </slot>

            <button
              type="button"
              class="m-popup-anchor-close"
              @click="onExistClose"
              v-if="hasExistClose"
            >
              <CommonSvgIcon icon="icon_xmark" class="h-full w-full" />
            </button>

            <div class="m-popup-tools" :class="setClass.headerTools" v-if="$slots.headerTools">
              <slot name="headerTools" />
            </div>
          </div>
          <div class="m-popup-body scrollbar --y" :class="setClass.body">
            <slot />
          </div>
          <footer class="m-popup-footer" :class="setClass.footer" v-if="$slots.footer">
            <slot name="footer" />
          </footer>
          <div class="m-popup-note" :class="setClass.note" v-if="$slots.note">
            <slot name="note" />
          </div>
          <CommonMPopupPromise />
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style lang="postcss"></style>
