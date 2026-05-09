<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
const isSelect = computed(() => props.data._isSelect)
const offlineInfo = computed(() => props.data.caseOfflineInfo || {})
const isShowButton = computed(() => /^(1|2)$/.test(offlineInfo.value.reasonID))
// const label = computed(() => {
//   const IDMap = {
//     1: ''
//   }
//   return
// })
</script>

<template>
  <div
    class="flex min-h-[150px] flex-col items-center rounded-[15px] px-[32px] py-[24px] tracking-wider p:min-w-[320px] p:text-[16px]"
    :class="{
      'bg-[--gray-f7]': !isSelect,
      'bg-[--white]': isSelect,
    }"
  >
    <p class="grow">
      <time :datetime="offlineInfo.dateDown">{{ offlineInfo.dateDown }}</time>
      {{ offlineInfo.exchangeHFID ? '更換物件' : offlineInfo.downReason }}
    </p>
    <div class="shrink-0">
      <BuyMAnchor
        text="刊登"
        :setClass="{
          main: '--h-35 --px-20 --oval --bg-green-6a2d --text-white',
        }"
      />
    </div>
    <!-- {{ isShowButton }} -->
    <!-- {{ offlineInfo }} -->
  </div>
</template>

<style lang="postcss"></style>
