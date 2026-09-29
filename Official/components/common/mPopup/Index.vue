<script setup>
/* component-deps —— 複製這支元件時要一起帶走:
   stores/common.js
   stores/.composables/useCommonActions.js
   stores/popup.js
   stores/.composables/usePopupActions.js
   assets/css/_common/vueTransition.css
     彈窗的進出場動畫定義在這裡。沒有它不會報錯也不會少畫面,只是開關的當下直接跳、沒有漸變。
   containers/common/AlertSystem.vue
   containers/common/ConfirmSystem.vue
   containers/common/CustomPopup.vue
   containers/common/ApiPromiseSystem.vue */
import './.css/variables.css'
import './.css/common.css'

/* 設定項可以依裝置各給一種值:{ p, pt, tm, t, m },寫法與 css 的前綴同一組語彙。

  **這一份刻意寫在元件自己的資料夾裡,不抽到共用工具。**
  元件庫的元件要能單獨複製走 —— 抽出去之後,複製的人少帶那一支就整組設定失效,
  而失效的樣子是「設定寫了卻沒有反應」,不會報錯。
  同樣的判斷在別的元件裡也有一份,那是刻意的重複。 */
const BREAKPOINT_KEYS = ['p', 'pt', 'tm', 't', 'm']

/* 目前是哪一種裝置,就對應到哪幾個 key。
  device 只會是 p | t | m 三種,而範圍型的前綴(pt 涵蓋桌機與平板、
  tm 涵蓋平板與手機)也會命中其中幾種。

  順序就是優先序:**單一裝置寫在前面,範圍寫在後面** ——
  同時寫了 { t: 'a', tm: 'b' } 時,平板取 'a'。
  指名那一個比涵蓋一片的更明確;反過來的話,寫了單一裝置的值會被範圍值蓋掉,
  看起來像是那一行沒有作用。 */
const BREAKPOINT_DEVICE_KEYS = {
  p: ['p', 'pt'],
  t: ['t', 'pt', 'tm'],
  m: ['m', 'tm'],
}

/* 依目前的裝置取出該用哪一個值。

  不是斷點物件的原樣回傳 —— 那種寫法代表「所有斷點都是這個值」。
  是斷點物件但這個裝置沒有對應的 key 時回 null,呼叫端自己決定那時候用什麼。

  先排除 ref 與 DOM 元素:它們也是物件,不先排掉的話會被當成斷點物件拆開,
  取出來的是 undefined,而那個設定從此無聲地失效。 */
const onResolveByDevice = (value, device) => {
  const isBreakpointObject =
    value != null &&
    typeof value === 'object' &&
    !('value' in value) &&
    !(typeof Element !== 'undefined' && value instanceof Element) &&
    BREAKPOINT_KEYS.some((key) => key in value)

  if (!isBreakpointObject) return value

  const keys = BREAKPOINT_DEVICE_KEYS[device] || []
  const matched = keys.find((key) => value[key] != null && value[key] !== false)

  return matched === undefined ? null : value[matched]
}

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

/* container 有沒有真的在畫面上 —— 關閉時要靠它判斷等不等得到退場(見下面的 watch) */
const containerRef = ref(null)

const isShowOverlay = ref(false)
const isShowPopup = ref(false)

const isOpen = computed(() => keyID.value && props.id === keyID.value)
const keyID = computed(
  () => alertData.value.id || confirmData.value.id || customData.value.id || apiPromiseData.value.id
)

// 每個 popup 實例只渲染自己那一份資料。
// 注意:用 props.id 判斷,不要用 keyID:關閉只清 id、其餘欄位留給退場動畫(見 usePopupActions),
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
    // 'bomb' | 'zoom' | 'bottomSheet',或用物件依裝置各給一種:{ p, pt, tm, t, m }
    mode: 'zoom',
    ...props.config,
  }
})

/* 依 config.mode 解析當前模式。

  寫成斷點物件時依目前的裝置取值({ m: 'bottomSheet' } 就是手機才用抽屜式)。
  判斷寫在這支檔案上面 —— 它認得範圍型的前綴(pt、tm);
  改寫成 mode[device] 的話,{ tm: … } 這種寫法讀不到值,
  設定看起來寫了而畫面上沒有反應。 */
const mode = computed(() => onResolveByDevice(config.value.mode, device.value) || 'zoom')

/* 每一種開闔模式配一種進出的動畫。

  名字不用模式名組出來(popup-zoom 那種)——
  轉場的名字講的是「什麼效果」,不綁哪一支元件在用,
  所以這裡要明寫對照,改動畫時看得出換成了哪一種。

  zoom 與 bomb 的版面完全相同(見 .css/common.css),差別只在這裡:
  zoom 是直線放大,bomb 會先衝過頭再彈回來。 */
const MODE_ANIMATIONS = {
  zoom: 'anim-zoom',
  bomb: 'anim-bounce',
  bottomSheet: 'anim-slide-up-late',
}

const transitionName = computed(() => MODE_ANIMATIONS[mode.value] || MODE_ANIMATIONS.zoom)

// container className:--zoom | --bomb | --bottomSheet
const modeClass = computed(() => `--${mode.value}`)

const setClass = computed(() => {
  return {
    main: '',
    container: '',
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

      await nextTick()

      /* 保底:container 從來沒有進到畫面上時,等不到它的退場。

        開啟時 isShowPopup 轉 true 之後,container 還要再等一次 flush 才掛上去。
        在那之間就被關掉的話(載入中的遮罩在別的彈窗關閉的瞬間短暫接手又立刻關),
        它一次都沒有渲染過 —— 沒有退場、@afterLeave 不會來,
        而遮罩正是等那一下才收。遮罩留在畫面上之後,那支彈窗就再也打不開。

        正常退場中的不會被這裡收掉:退場期間它還留在 DOM 上,ref 仍然有值,
        所以「內容先縮、遮罩後淡」的順序完整保留。 */
      if (!isOpen.value && !containerRef.value) isShowOverlay.value = false

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
  <Transition name="anim-fade-out-late">
    <div class="m-popup" :class="[modeClass, setClass.main]" v-if="isShowOverlay">
      <Transition :name="transitionName" @afterLeave="onAfterLeave">
        <div
          class="m-popup-container"
          :class="setClass.container"
          ref="containerRef"
          v-if="isShowPopup"
        >
          <div
            class="m-popup-header"
            :class="[setClass.header, { '--has-close': hasExistClose }]"
            v-if="title || $slots.headerTools"
          >
            <slot name="header">
              <!-- 標題佔滿整行寬,所以沒有標題時不能留一個空的在這裡 ——
                留著的話,只有工具列的彈窗會被它推到第二行。 -->
              <p class="m-popup-title" :class="setClass.headerTitle" v-if="title || icon">
                <CommonMSvgIcon
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
              <CommonMSvgIcon icon="icon_xmark" class="m-popup-anchor-close-icon" />
            </button>

            <div class="m-popup-tools" :class="setClass.headerTools" v-if="$slots.headerTools">
              <slot name="headerTools" />
            </div>
          </div>
          <div class="m-popup-body" :class="setClass.body">
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
