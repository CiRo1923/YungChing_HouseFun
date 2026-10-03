<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   assets/css/_common/vueTransition.css
     轉場動畫定義在這裡。沒有它不會報錯也不會少畫面,只是切換的當下直接跳、沒有漸變。
   stores/.composables/useCommonActions.js
     這支元件讀的那個 store 的行為。少了它畫面編譯得過,只是資料永遠是空的。
   stores/common.js
     這支元件讀的 store。少了它畫面編譯得過,只是資料永遠是空的。 */
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

// 組件自身 config，與父系傳入的 props.config 合併
const config = computed(() => {
  return {
    isAccordion: false,
    ...props.config,
    toggleText: {
      expand: '展開',
      collapse: '收合',
      ...props.config.toggleText,
    },
  }
})

// isAccordion 可為 boolean，或依裝置區分的物件 {p, pt, tm, t, m}
// device.value 僅回傳 p / t / m，pt（電腦+平板）、tm（平板+手機）為跨裝置群組
const deviceKeyMap = {
  p: ['p', 'pt'],
  t: ['t', 'pt', 'tm'],
  m: ['m', 'tm'],
}
const resolveAccordion = (isAccordion) => {
  if (isAccordion && typeof isAccordion === 'object') {
    const keys = deviceKeyMap[device.value] || []
    return keys.some((key) => isAccordion[key])
  }
  return !!isAccordion
}

// 當前裝置是否為手風琴（可收合）模式
const isAccordion = computed(() => resolveAccordion(config.value.isAccordion))

// 使用者手動展開狀態（僅在手風琴模式下作用）
const isExpand = ref(false)

// 非手風琴模式永遠顯示；手風琴模式則由 isExpand 控制
const isShow = computed(() => !isAccordion.value || isExpand.value)

const toggleText = computed(() =>
  isExpand.value ? config.value.toggleText.collapse : config.value.toggleText.expand
)

const setClass = computed(() => {
  return {
    main: '',
    container: '',
    show: '',
    hide: '',
    footer: '',
    footerContainer: '',
    ...props.setClass,
  }
})

// 不帶參數：切換；帶 boolean：直接指定展開狀態（@click 傳進來的事件物件會被忽略）
const onToggle = (isShow) => {
  isExpand.value = typeof isShow === 'boolean' ? isShow : !isExpand.value
}

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="m-accordion" :class="setClass.main">
    <div class="m-accordion-container" :class="setClass.container">
      <div class="m-accordion-show" :class="setClass.show">
        <slot />
      </div>
      <Transition name="anim-collapse-max">
        <div v-show="isShow" class="m-accordion-hide" :class="setClass.hide">
          <slot name="hide" :isAccordion="isAccordion" :onToggle="onToggle" />
        </div>
      </Transition>
    </div>
    <footer class="m-accordion-footer" :class="setClass.footer" v-if="$slots.footer">
      <slot
        name="footer"
        :isAccordion="isAccordion"
        :toggleText="toggleText"
        :onToggle="onToggle"
      />
    </footer>
  </div>
</template>
