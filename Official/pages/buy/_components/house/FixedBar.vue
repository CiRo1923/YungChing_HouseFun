<script setup>
const props = defineProps({
  // 觸發捲動判斷的目標元素(物件主資訊/照片區塊),由頁面層傳入
  basicEl: {
    type: Object,
    default: null,
  },
})

const common = useCommonStore()
const { device } = storeToRefs(common)
const buyHouse = useBuyHouseStore()
const { broker } = storeToRefs(buyHouse)
const buyProject = useBuyProjectStore()
const { message } = storeToRefs(buyProject)
const { reset } = useBuyProjectActions()
const buyPopup = useBuyPopupStore()
const { onMergeBtns, onCustom } = usePopupActions()
const route = useRoute()

const isDeviceM = computed(() => device.value === 'm')

// 開「詢問與留言」彈窗(內容與 PC 版共用 popupMessage,手機以 bottomSheet 呈現)。
// ⚠️ 必須自己初始化:PC 版是由 basic/Comment.vue 的 onInit 設定 houseId,
//    但那支是 v-if="!isDeviceM",手機版根本不渲染 —— 少了這兩行,
//    送出的會是上一次留言留下的物件 id(例如列表頁點過的別間房子)。
const onPopupMessage = async () => {
  reset.onMessage()
  message.value.apiData.houseId = route.params.hfid

  await onCustom({
    id: 'popupMessage',
    title: '詢問與留言',
    btns: onMergeBtns(buyPopup.buttons.alert, [
      {
        label: '我要預約留言',
        type: 'sure',
        // 不自動關窗:驗證失敗要留在原地,由 popup/Message.vue 的 onSure 決定後續
        isClose: false,
      },
    ]),
  })
}

// 底部常駐 bar 是 fixed、不佔文檔流,把實際高度寫進 CSS 變數,
// 讓 .l-footer 補等高 padding、BuyMTop 也依它往上讓位(見 assets/css/_common/layout.css)。
// 高度由內容撐出(經紀人名 + 標籤一行、公司資訊兩行),字級一調就變,故用量測而非寫死。
const FIXED_BOTTOM_VAR = '--fixed-bottom-height'
const bottomBarRef = ref(null)
let bottomBarObserver = null

const onSetFixedBottomHeight = (height) => {
  document.documentElement.style.setProperty(FIXED_BOTTOM_VAR, `${height}px`)
}

// ⚠️ 變數掛在 documentElement 上,不會隨元件卸載自動消失。
//    離開本頁(SPA 換頁)或切到非手機時務必歸零,否則列表頁等會殘留一段空白 padding。
watch(bottomBarRef, (el) => {
  bottomBarObserver?.disconnect()
  bottomBarObserver = null

  if (!el) {
    onSetFixedBottomHeight(0)

    return
  }

  onSetFixedBottomHeight(el.offsetHeight)
  bottomBarObserver = new ResizeObserver(() => onSetFixedBottomHeight(el.offsetHeight))
  bottomBarObserver.observe(el)
})

// 以下 isFixed 狀態機給「捲出 Basic 才出現」的 PC / 手機上方 bar 用(待補)。
// 手機下方經紀人聯絡列不吃這組——它是常駐 bar,一開始就要顯示,跟 D-11 規格的
// 捲動觸發 fixed bar 是兩件事,不能共用同一個顯示條件。
const isFixed = ref(false)
// 滑入動畫的第二段:--fixed 先讓元素定位到視窗外側,下一個 frame 才加 --in 滑進來。
// 詳見 pages/buy/_components/list/SearchFunction.vue 的同一手法。
const isFixedIn = ref(false)
// 進場當下的捲動位置,拿來當退場門檻,進退場才會對稱(理由同 SearchFunction)
const fixedFromY = ref(0)

// 捲出 Basic(物件主資訊/照片)區塊底部即出現;此 bar 平常不佔版位,
// 純粹是觸發後才掛上的 overlay,不像 SearchFunction 需要 placeholder 防止版面塌陷。
const onScroll = () => {
  const el = props.basicEl

  if (!el) return

  if (isFixed.value) {
    // 退場不播動畫,理由同 SearchFunction:原位剛回到視窗內就該立刻收起
    if (window.scrollY <= fixedFromY.value) {
      isFixed.value = false
      isFixedIn.value = false
    }

    return
  }

  if (el.getBoundingClientRect().bottom <= 0) {
    fixedFromY.value = window.scrollY
    isFixed.value = true

    requestAnimationFrame(() => {
      isFixedIn.value = true
    })
  }
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)

  bottomBarObserver?.disconnect()
  bottomBarObserver = null
  onSetFixedBottomHeight(0)
})
</script>

<template>
  <!-- PC 上方 bar、手機上方 bar 待確認後補上;此處先做手機下方經紀人聯絡列。
       常駐顯示,不吃 isFixed——頁面一載入就要看得到,不是捲動才出現。 -->
  <div
    class="fixed-bar-bottom fixed inset-x-0 bottom-0 z-[2] flex items-center gap-x-[10px] bg-[--gray-333] p-[20px] text-[--white]"
    ref="bottomBarRef"
    v-if="isDeviceM"
  >
    <div class="min-w-0 grow">
      <p class="flex items-center gap-x-[8px]">
        <span class="line-clamp-1 text-[16px] leading-[1]">{{ broker.name }}</span>
        <BuyMTagDefault
          label="社區達人"
          :setClass="{
            main: 'fixed-bar-tag --oval --text-white --px-10 --py-2 shrink-0',
            label: 'text-[12px]',
          }"
        />
      </p>
      <p class="line-clamp-1 text-[12px]">{{ broker.brand }}</p>
      <p class="line-clamp-1 text-[12px]">{{ broker.store }}</p>
    </div>
    <ul class="fixed-bar-tools flex shrink-0 items-center">
      <!-- 用 slot 自行組裝而非 text / config.icon:斷行由 <br> 明確指定,
           不靠寬度去「逼」文字換行 —— 那種寫法一旦調字級或字距就會破版。 -->
      <li>
        <CommonMAnchor
          :href="`tel:${broker.phone}`"
          :config="{
            // tel: 不該先開空白分頁再交給系統撥號,覆寫掉 <a> 預設的 _blank
            target: '_self',
          }"
          :setClass="{
            main: 'flex-col gap-y-[4px]',
          }"
        >
          <CommonSvgIcon icon="icon_tel" class="h-[24px] w-[24px] p-[3px]" />
          <em class="text-center text-[14px] leading-[1.2]">來電<br />洽詢</em>
        </CommonMAnchor>
      </li>
      <li>
        <CommonMAnchor
          :setClass="{
            main: 'flex-col gap-y-[4px]',
          }"
          @click="onPopupMessage"
        >
          <CommonSvgIcon icon="icon_dialogue" class="h-[24px] w-[24px] p-[3px]" />
          <em class="text-center text-[14px] leading-[1.2]">預約<br />留言</em>
        </CommonMAnchor>
      </li>
    </ul>
  </div>
</template>

<style lang="postcss">
/* 社區達人標籤:mTag 的 --bg-* 都是純色,漸層另外補。
   色值與 basic/BrokerInfo.vue 的 .account-info-community 相同(同一個標籤的 PC 版樣式)。 */
.fixed-bar-tag {
  background-image: linear-gradient(90deg, var(--green-8b0d), var(--green-4a7f));
}

/* 項目間距:padding 只加在「相鄰的那一側」——首項不加左、末項不加右,
   外緣間距一律交給容器的 padding,避免與它疊加成兩倍。
   相鄰兩項各出 20px,中間留白共 40px。 */
.fixed-bar-tools {
  > li {
    &:not(:first-child) {
      @apply relative pl-[20px];

      /* 分隔線:用 ::before 而非獨立的 li,語意上才不會多出一個空項目。
         ⚠️ 用 absolute 貼齊 li 左邊界(即 padding 之外),線的兩側才會是
            前一項的 padding-right 與本項的 padding-left —— 等寬、對稱。
            若讓 ::before 留在文檔流內,它會被推到 padding-left 之後,線就偏右了。 */
      &::before {
        @apply absolute left-0 top-1/2 h-[50px] w-[1px] -translate-y-1/2 bg-[--white-4d] content-default;
      }
    }

    &:not(:last-child) {
      @apply pr-[20px];
    }
  }
}
</style>
