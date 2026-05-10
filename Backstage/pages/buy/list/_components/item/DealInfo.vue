<script setup>
const emits = defineEmits(['click:deal'])
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
const isChecked = computed(() => props.data._checked.value)
const dealInfo = computed(() => props.data.caseDealInfo || {})

const onClick = () => {
  emits('click:deal', props.data)
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
      <!-- <pre>{{ dealInfo }}</pre> -->
      <p class="text-[16px]">
        <time :datetime="dealInfo.dateDeal">{{ dealInfo.dateDeal }}</time> 成交
      </p>
      <span class="block text-[14px]">個人實績：{{ dealInfo.isShowDeal ? '顯示' : '不顯示' }}</span>
    </div>
    <div class="shrink-0">
      <BuyMAnchor
        text="成交設定"
        :setClass="{
          main: '--h-35 --px-20 --oval --bg-green-6a2d --text-white',
        }"
        @click="onClick"
      />
    </div>
  </div>
</template>

<style lang="postcss"></style>
