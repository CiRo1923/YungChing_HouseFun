<script setup>
const footerRef = inject('footerRef', ref(null))

const isHidden = ref(true)
const bottom = ref(10)

// 捲動:1) 超過 200px 顯示;2) footer 進入視窗時,bottom = 10 + footer 露出的高度,避免蓋到 footer
const onScroll = () => {
  isHidden.value = window.scrollY < 200

  const el = footerRef.value
  // footer 露出視窗的高度(未進入視窗為 0,完全進入時等於 footer 高度)
  const overlap = el
    ? Math.min(el.offsetHeight, Math.max(0, window.innerHeight - el.getBoundingClientRect().top))
    : 0

  bottom.value = 10 + overlap
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
    :style="{ bottom: `${bottom}px` }"
    @click="onCkick"
  >
    <CommonSvgIcon icon="icon_top_arrow" class="h-[20px] w-[20px]" />
  </button>
</template>

<style lang="postcss"></style>
