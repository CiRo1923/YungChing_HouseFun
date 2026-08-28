<script setup>
import '@css/_modules/common/mPopup/variables.css'
import '@css/_modules/common/mPopup/common.css'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const popup = usePopupStore()
const { alertData, confirmData, customData, apiPromiseData } = storeToRefs(popup)
const { onReset } = usePopupActions()

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  config: {
    type: Object,
    default: () => ({}),
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

// 每個 popup 實例只渲染自己那一份資料。
// ⚠ 用 props.id 判斷,不要用 keyID:關閉只清 id、其餘欄位留給退場動畫(見 usePopupActions),
//   所以殘留值一定存在;而退場期間 keyID 已是 null,用 keyID 會 fallback 到別人的殘留值 ——
//   apiPromise 沒有 title,就會把上一個 custom popup 的標題與 icon 撿來顯示
//   (例如 onPopupLogin:關掉「會員登入」後,資料處理中的燈箱會頂著那個標題)。
const activeData = computed(() => {
  if (props.id === 'alertSystem') return alertData.value
  if (props.id === 'confirmSystem') return confirmData.value
  if (props.id === 'apiPromiseSystem') return apiPromiseData.value

  return customData.value
})

const hasExistClose = computed(() => activeData.value.hasExistClose)

const title = computed(() => activeData.value.title)

const icon = computed(() => activeData.value.icon)

const config = computed(() => {
  return {
    mode: 'zoom', // 'zoom' | 'bottomSheet' : {p: 'zoom' | 'bottomSheet', pt: 'zoom' | 'bottomSheet', tm: 'zoom' | 'bottomSheet', t: 'zoom' | 'bottomSheet', m: 'zoom' | 'bottomSheet'}`
    ...props.config,
  }
})

// 依 config.mode 解析當前模式；mode 為物件時用 device (p | t | m) 取值
const mode = computed(() => {
  const { mode } = config.value
  return typeof mode === 'object' && mode !== null ? mode[device.value] || 'zoom' : mode
})

// Transition name：popup-zoom | popup-bottomSheet
const transitionName = computed(() => `popup-${mode.value}`)

// container className：--zoom | --bottomSheet
const modeClass = computed(() => `--${mode.value}`)

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

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <Transition name="popup-overlay">
    <div class="m-popup" :class="[modeClass, setClass.main]" v-if="isShowOverlay">
      <Transition :name="transitionName" @afterLeave="onAfterLeave">
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
                <b class="m-popup-title-text" v-html="title" />
              </p>
            </slot>

            <button
              type="button"
              class="m-popup-anchor-close"
              @click="onExistClose"
              v-if="hasExistClose"
            >
              <CommonSvgIcon icon="icon_xmark" class="m-popup-anchor-close-icon" />
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
