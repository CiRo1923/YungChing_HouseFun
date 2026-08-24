<script setup>
const footerRef = inject('footerRef', ref(null))

const isHidden = ref(true)
const footerOverlap = ref(0)

// 捲動:1) 超過 200px 顯示;2) footer 進入視窗時往上讓位,避免蓋到 footer。
// 底部另有常駐 fixed bar 時也要讓位,高度來自 CSS 變數 --fixed-bottom-height。
//
// ⚠️ 兩者取「較大值」而非相加:.l-footer 的 padding-bottom 就是那個變數,
//    而 offsetHeight 含 padding —— footer 進入視窗後 overlap 已內含一份 bar 高度,
//    再相加會重複計算,捲到底時 GoTop 會浮高兩個 bar 的距離。
//    取 max 兩種情境都對:footer 未進視窗時由 bar 高度決定,進視窗後由 overlap 接手。
const onScroll = () => {
  isHidden.value = window.scrollY < 200

  const el = footerRef.value
  // footer 露出視窗的高度(未進入視窗為 0,完全進入時等於 footer 高度,含 padding)
  footerOverlap.value = el
    ? Math.min(el.offsetHeight, Math.max(0, window.innerHeight - el.getBoundingClientRect().top))
    : 0
}

const onCkick = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('resize', onScroll)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <button
    type="button"
    class="fixed left-1/2 z-[2] flex h-[50px] w-[50px] items-center justify-center rounded-full text-[--white] transition-opacitys duration-300 bg-hexa-[--black,0.6] m:translate-x-[calc(355px_/2_-_100%)] t:translate-x-[calc(748px_/2_-_100%)] p:translate-x-[calc(600px_+_25px)]"
    :class="[{ 'invisible opacity-0': isHidden }, { 'visible opacity-100': !isHidden }]"
    :style="{
      bottom: `calc(10px + max(${footerOverlap}px, var(--fixed-bottom-height, 0px)))`,
    }"
    @click="onCkick"
  >
    <CommonSvgIcon icon="icon_top_arrow" class="h-[20px] w-[20px]" />
  </button>
</template>

<style lang="postcss"></style>
