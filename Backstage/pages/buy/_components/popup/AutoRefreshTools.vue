<script setup>
import { numberComma } from '@js/_prototype.js'

const popup = usePopupStore()
const { customData } = storeToRefs(popup)

const items = computed(() => {
  return customData.value.data.listAvailablePlan.map((item) => {
    return {
      id: `${item.durationDays}_${item.availableCount}`,
      label: `${item.durationDays} 天`,
      value: item.availableCount,
    }
  })
})
</script>

<template>
  <div
    class="text-[14px] text-[--gray-666] m:w-full t:gap-x-[20px] t:px-[8px] pt:ml-auto pt:flex pt:h-[40px] pt:items-center pt:rounded-[15px] pt:bg-[--gray-f7] p:gap-x-[40px] p:px-[16px]"
  >
    <p class="flex flex-row-reverse items-center justify-center gap-x-[3px]">
      <span>剩餘自動刷新</span>
      <CommonSvgIcon icon="icon_double_star" class="h-[18px] w-[18px]" />
    </p>
    <BuyMSeparator
      :items="items"
      :setClass="{
        main: '--horizontal p:--gap-x-32 tm:--gap-x-16 text-[--gray-666] m:mt-[3px] m:justify-center m:rounded-[15px] m:bg-[--gray-f7] m:px-[8px] m:py-[2px] pt:ml-auto',
      }"
      v-slot="{ item }"
    >
      {{ item.label }}：<b class="font-semibold text-[--orange-e646]">
        {{ numberComma.add(item.value) }}
      </b>
    </BuyMSeparator>
  </div>
</template>

<style lang="postcss"></style>
