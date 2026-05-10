<script setup>
const emits = defineEmits(['click:publish'])
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
const isChecked = computed(() => props.data._checked.value)
const offlineInfo = computed(() => props.data.caseOfflineInfo || {})
// 1: 自行關閉 / 2: 刊登到期關閉 / 4: 委託到期關閉 / 7: 客服強制下架 / 8: 源頭下架 / 9: 更換物件
const isShowButton = computed(() => /^(1|2|9)$/.test(offlineInfo.value.reasonID))
// const label = computed(() => {
//   const IDMap = {
//     1: ''
//   }
//   return
// })

const onClick = () => {
  emits('click:publish', props.data)
}
</script>

<template>
  <div
    class="flex min-h-[150px] flex-col items-center rounded-[15px] px-[32px] py-[24px] tracking-wider p:min-w-[320px] p:text-[16px]"
    :class="{
      'bg-[--gray-f7]': !isChecked,
      'bg-[--white]': isChecked,
    }"
  >
    <div class="grow text-center tracking-wider text-[--gray-666]">
      <p>
        <time :datetime="offlineInfo.dateDown">{{ offlineInfo.dateDown }}</time>
        {{ offlineInfo.exchangeHFID ? '更換物件' : offlineInfo.downReason }}
      </p>
    </div>
    <div class="shrink-0" v-if="isShowButton">
      <BuyMAnchor
        text="刊登"
        :setClass="{
          main: '--h-35 --px-20 --oval --bg-green-6a2d --text-white',
        }"
        @click="onClick"
      />
    </div>
    <!-- {{ isShowButton }} -->
    <!-- {{ offlineInfo }} -->
  </div>
</template>

<style lang="postcss"></style>
