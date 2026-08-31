<script setup>
import { onResolveByDevice } from '@js/_projectPrototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onValueGetText } = useManageActions()
const buyList = useBuyListStore()
const { content, price, type, pin, parking, age, floor, unitPrice, face, nearBy, more } =
  storeToRefs(buyList)
const { isChannelRegion, isChannelMrt } = useBuyListActions()

// const route = useRoute()

const emits = defineEmits(['apiSearch', 'routerPush', 'suggest'])

const searchFunctionRef = ref(null)
const isFixed = ref(false)
// 滑入動畫的第二段:--fixed 先讓元素定位到視窗上方外側,下一個 frame 才加 --in 滑進來。
// ⚠️ 兩段不能併成一個 class:同一個 frame 內同時套用「定位」與「最終位置」,
//    瀏覽器沒有可插補的起始值,transition 不會播,會變成硬切。
const isFixedIn = ref(false)
// 進場當下的捲動位置,拿來當退場門檻。
// ⚠️ 不能在 fixed 後改用 getBoundingClientRect 判斷:元素一旦脫離文檔流,
//    rect 永遠貼在視窗頂端 → 判定回「未超過」→ 取消 fixed → 又符合進場條件,來回抖動。
//    進退場共用同一個門檻值才對稱。
const fixedFromY = ref(0)
// 置頂後元素離開文檔流,用等高的 placeholder 補上,避免下方列表整片上跳
const fixedHeight = ref(0)

const isDeviceM = computed(() => device.value === 'm')
// const data = computed(() => content.value.data || [])
const apiData = computed(() => content.value.apiData || {})

const onApiSearch = () => {
  emits('apiSearch')
}

const onRouterPush = async () => {
  emits('routerPush')
}

const onSuggest = (setOptions) => {
  emits('suggest', setOptions)
}

const onInit = () => {
  const onLable = (name, data, options) => {
    const isOptionsString = options && typeof options === 'string'

    if (apiData.value[name] && isOptionsString)
      return onValueGetText(options, apiData.value[name].split(','))
    if (apiData.value[name] && !isOptionsString) {
      const value = apiData.value[name]
      const noMatch = !data.options.find((item) => item.value === value)

      if (noMatch) {
        const min = value.split('-')[0]
        const max = value.split('-')[1]

        const isSame = !!(max && min && max === min)

        if (isSame) return `${min} ${data.unit}`

        if (max && min) {
          return `${min} - ${max} ${data.unit}`
        } else if (min) {
          return `${min} ${data.unit}以上`
        } else if (max) {
          return `${max} ${data.unit}以下`
        }
      }

      return `${apiData.value[name]} ${data.unit}`
    }

    return onResolveByDevice(data.defaultLabel, device.value)
  }
  const onMinMax = (name, data) => {
    const value = apiData.value[name]
    const noMatch = !data.options.find((item) => item.value === value)

    if (value && noMatch) {
      const min = value.split('-')[0]
      const max = value.split('-')[1]

      if (min) data.min = min
      if (max) data.max = max
    }
  }

  more.value.label = onResolveByDevice(more.value.defaultLabel, device.value)

  price.value.label = onLable('price', price.value)
  type.value.label = onLable('type', type.value, 'caseType')
  pin.value.label = onLable(pin.value.type, pin.value)
  onMinMax(pin.value.type, pin.value)
  parking.value.label = onLable('parking', parking.value, 'parkingMode')
  age.value.label = onLable('age', age.value)
  onMinMax('age', age.value)
  floor.value.label = onLable('floor', floor.value)
  onMinMax('floor', floor.value)
  unitPrice.value.label = onLable('uniprice', unitPrice.value)
  onMinMax('uniprice', unitPrice.value)
  face.value.label = onLable('dt', face.value, 'face')
  nearBy.value.label = onLable('ft', nearBy.value, 'nearBy')
}

// 捲動超過 search-function 本身(底部離開視窗頂端)即置頂
const onScroll = () => {
  const el = searchFunctionRef.value

  if (!el) return

  if (isFixed.value) {
    // 退場不播動畫:此時原位剛回到視窗內,元素就該立刻歸位,
    // 慢慢滑出反而會讓原位空一段時間(placeholder 撐著但沒內容)
    if (window.scrollY <= fixedFromY.value) {
      isFixed.value = false
      isFixedIn.value = false
    }

    return
  }

  // 未置頂時元素仍在文檔流中,可直接量
  if (el.getBoundingClientRect().bottom <= 0) {
    // ⚠️ 順序不能反:置頂後 Condition / Filter 會被 v-if 拔掉,
    //    等 isFixed 設好再量會量到矮版高度,placeholder 就會偏矮
    fixedHeight.value = el.offsetHeight
    fixedFromY.value = window.scrollY
    isFixed.value = true

    // 隔一個 frame 才滑入,讓 --fixed 的起始位置(視窗上方外側)先套用生效
    requestAnimationFrame(() => {
      isFixedIn.value = true
    })
  }
}

// resize 後原始高度會變(換行、斷點切換增減欄位),但置頂中量不到真值 ——
// Condition / Filter 已被 v-if 拔掉,offsetHeight 是矮版。
// 故先讓元素歸位量到真高度,再依當下捲動位置決定是否復位;
// 否則 placeholder 會停在舊高度,退場那一刻與元素真實高度的落差會讓版面跳一下。
const onRefresh = async () => {
  if (isFixed.value) {
    isFixed.value = false
    isFixedIn.value = false
  }

  await nextTick()

  const el = searchFunctionRef.value

  if (!el) return

  fixedHeight.value = el.offsetHeight

  if (el.getBoundingClientRect().bottom <= 0) {
    fixedFromY.value = window.scrollY
    isFixed.value = true
    // 復位不重播滑入動畫:連續拖曳 resize 會讓 bar 一直重啟 transition
    isFixedIn.value = true
  }
}

onResize()
onInit()

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onRefresh)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onRefresh)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div
    class="search-function m:border-b-[1px] m:border-b-[--gray-e5] m:py-[10px] tm:px-[10px]"
    :class="{ '--fixed': isFixed, '--in': isFixedIn }"
    ref="searchFunctionRef"
  >
    <div class="search-mode t:py-[15px] p:space-y-[15px] p:py-[25px]">
      <ul class="search-mode-content relative flex flex-wrap gap-x-[5px] gap-y-[10px] p:grow">
        <li class="search-mode-item relative tm:w-[100px] p:w-[155px] p:shrink-0">
          <PageBuyListSearchRegion @click:routePush="onRouterPush" v-if="isChannelRegion" />
          <PageBuyListSearchMrt
            name="mrt"
            :config="{
              areaAxis: {
                m: 'x',
              },
            }"
            v-if="isChannelMrt"
          />
        </li>
        <li class="search-mode-item relative tm:flex-1 p:w-[155px] p:shrink-0">
          <PageBuyListSearchPurpose @click:routePush="onRouterPush" />
        </li>
        <li class="search-mode-item relative tm:flex-1 p:w-[155px] p:shrink-0">
          <PageBuyListSearchPrice @click:routePush="onRouterPush" />
        </li>
        <li class="search-mode-item relative tm:flex-1 p:w-[155px] p:shrink-0" v-if="!isDeviceM">
          <PageBuyListSearchRoom />
        </li>
        <li class="search-mode-item relative tm:flex-1 p:w-[155px] p:shrink-0">
          <PageBuyListSearchMore @click:routePush="onRouterPush" />
        </li>
        <li
          class="search-mode-item relative flex min-w-0 items-center gap-x-[5px] overflow-hidden tm:w-full p:grow"
        >
          <PageBuyListSearchKeyword @input="onSuggest" />
          <CommonMAnchor
            text="搜尋"
            :config="{
              icon: {
                name: 'icon_search',
                position: 'left',
              },
            }"
            :setClass="{
              main: '--bg-orange-f74c hover:--bg-orange-e646 --text-white --oval p:--h-45 tm:--px-10 p:--px-20 tm:--h-40 shrink-0 gap-x-[3px]',
              icon: 'h-[16px] w-[16px]',
            }"
            @click="onRouterPush"
            v-if="!isDeviceM"
          />
        </li>
      </ul>
      <PageBuyListSearchCondition v-if="!isFixed" />
    </div>
    <PageBuyListSearchFilter
      @click="onApiSearch"
      @click:routePush="onRouterPush"
      v-if="isDeviceM && !isFixed"
    />
  </div>
  <div class="search-function-placeholder" :style="{ height: `${fixedHeight}px` }" v-if="isFixed" />
</template>

<style lang="postcss">
.search-function {
  @apply w-full;

  /* 起始位置:定位到視窗上方外側。滑入由 --in 接手,退場則直接移除、不播動畫 */
  &.\-\-fixed {
    @apply fixed left-0 top-0 z-[2] -translate-y-full bg-[--green-8b0d] transition-transform duration-300;

    &.\-\-in {
      @apply translate-y-0;
    }
  }
}

.search-mode {
  @apply mx-auto max-w-[1200px];
}
</style>
