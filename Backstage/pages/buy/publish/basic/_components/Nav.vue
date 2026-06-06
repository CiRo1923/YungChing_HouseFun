<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
})

// 點擊錨點捲動到對應 li 時，與視窗頂端保留的間距（同時作為 active 判定的基準線）
const SCROLL_OFFSET = 20
// Nav 與容器頂端保留的間距
const TOP_GAP = 20
// active 判定基準線：由下往上算螢幕高度的 2/3（= 距視窗頂端 1/3）
const ACTIVE_RATIO = 2 / 3

const navRef = ref(null)
const isOverflow = ref(false)
const top = ref(0)
const activeId = ref('')

// 快取面板的定位容器，與「面板右緣相對容器右緣的位移」
// 讓面板被 v-if 隱藏後，window resize 仍能重算是否該重新顯示（避免單向 latch）
const containerEl = ref(null)
const panelOffsetRight = ref(0)

const isDeviceM = computed(() => device.value === 'm')
// 手機板，或面板右緣超出螢幕寬度時隱藏（搭配 v-if="!isHide"）
const isHide = computed(() => isDeviceM.value || isOverflow.value)

// 取得對應的 [data-component] 元素
const onTarget = (id) => document.querySelector(`[data-component="${id}"]`)

// 量測面板右緣是否超出螢幕寬度（超出 → isOverflow → 隱藏）
// 顯示中時更新快取（容器參考 + 面板右緣相對位移），
// 使面板被 v-if 移除後，仍能靠快取於 window resize 時重算
const onMeasure = () => {
  const ul = navRef.value

  if (ul?.offsetParent) {
    containerEl.value = ul.offsetParent
    panelOffsetRight.value =
      ul.getBoundingClientRect().right - containerEl.value.getBoundingClientRect().right
  }

  if (!containerEl.value) return

  const containerRight = containerEl.value.getBoundingClientRect().right
  isOverflow.value = containerRight + panelOffsetRight.value > window.innerWidth
}

// top 跟著卷軸滾動計算，讓 Nav 停留在可視範圍
const onUpdateTop = () => {
  const ul = navRef.value
  const parent = ul?.offsetParent

  if (!ul || !parent) return

  const parentTop = parent.getBoundingClientRect().top + window.scrollY
  const desired = window.scrollY - parentTop + TOP_GAP
  const max = Math.max(parent.offsetHeight - ul.offsetHeight, 0)

  top.value = Math.min(Math.max(desired, 0), max)
}

// 依卷軸位置判定目前所在區塊（取最後一個已通過基準線的區塊）
const onUpdateActive = () => {
  // 原基準線：元素頂端到達視窗頂端附近
  const topLine = window.scrollY + SCROLL_OFFSET + 1
  // 多加判斷：由下往上算 2/3 的基準線（= 距視窗頂端 1/3）
  const ratioLine = window.scrollY + window.innerHeight * (1 - ACTIVE_RATIO)

  let current = ''
  for (const item of props.data) {
    const el = onTarget(item.id)
    if (!el) continue

    const elTop = el.getBoundingClientRect().top + window.scrollY

    // 原邏輯：頂端通過視窗頂端基準線
    if (elTop <= topLine) current = item.id

    // 多加：元素已超過「由下往上 2/3」基準線，也更新為目前區塊
    if (elTop <= ratioLine) current = item.id
    else break
  }

  activeId.value = current || props.data[0]?.id || ''
}

// 重新定位：只校正 top 與 active（不量測 overflow）
const onReposition = () => {
  onUpdateTop()
  onUpdateActive()
}

let ticking = false
const onScroll = () => {
  if (ticking) return

  ticking = true
  requestAnimationFrame(() => {
    onReposition()
    ticking = false
  })
}

// 量測 overflow（含 onResize 更新 device）後再定位 —— 僅由 window resize / 掛載 / data 變動觸發
const onRefresh = () => {
  onResize()
  onMeasure()
  onReposition()
}

// 點擊錨點：平滑捲動到對應的 [data-component] li
const onClick = (id) => {
  const target = onTarget(id)
  if (!target) return

  const offsetTop = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET

  activeId.value = id

  window.scrollTo({
    top: offsetTop,
    behavior: 'smooth',
  })
}

// data 變動（例：casePurpose 篩選）會改變 li 數量，需重新量測
watch(
  () => props.data,
  () => nextTick(onRefresh)
)

// 顯示狀態切換時（Nav 重新掛載）只校正 top 與 active
// 不可用 onRefresh —— 它會重新量測 overflow，造成 isHide 連鎖更新
watch(isHide, () => nextTick(onReposition))

onMounted(() => {
  onRefresh()
  window.addEventListener('resize', onRefresh)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', onRefresh)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <ul
    ref="navRef"
    class="absolute right-0 rounded-[15px] bg-[#ccc] bg-[--white] p:translate-x-[calc(100%_+40px)] p:space-y-[8px] p:p-[10px]"
    :style="{ top: `${top}px` }"
    v-if="!isHide"
  >
    <li v-for="(item, index) in props.data" :key="`${item.id}_${index}`">
      <!-- --curr: --bg-orange-e646 設定在 setClass.main  -->
      <BuyMAnchor
        :text="item.label"
        :setClass="{
          main: `p:--h-35 p:--px-20 --oval --text-white ${activeId === item.id ? '--bg-orange-e646' : '--bg-green-6a2d'}`,
        }"
        @click="onClick(item.id)"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
