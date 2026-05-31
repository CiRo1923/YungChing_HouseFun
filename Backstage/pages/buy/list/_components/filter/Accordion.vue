<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const emits = defineEmits(['search'])

const isDeviceM = computed(() => device.value === 'm')

const onSearchClick = () => {
  emits('search')
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
  <div class="list-accordion m:space-y-[16px] pt:flex pt:items-center pt:gap-x-[8px]">
    <div
      class="list-accordion-container m:space-y-[16px] pt:flex pt:grow pt:items-center pt:gap-x-[8px]"
    >
      <div class="list-accordion-default pt:flex pt:shrink-0 pt:items-center pt:gap-x-[8px]">
        <slot />
      </div>
      <div
        class="list-accordion-hide m:space-y-[16px] pt:flex pt:grow pt:items-center pt:gap-x-[8px]"
      >
        <slot name="hide" />
      </div>
    </div>
    <footer class="list-accordion-footer pt:shrink-0">
      <ul class="flex items-center justify-between">
        <li v-if="isDeviceM">
          <BuyMAnchor
            text="更多搜尋"
            :setClass="{
              main: '--border-gray-e5 --bg-white --oval --h-30 --px-20 --text-gray-666',
            }"
          />
        </li>
        <li>
          <BuyMAnchor
            text="搜尋"
            :setClass="{
              main: '--bg-green-6a2d --oval --h-35 --px-20 --text-white',
            }"
            @click="onSearchClick"
          />
        </li>
      </ul>
    </footer>
  </div>
</template>

<style lang="postcss"></style>
