<script setup>
import { onFormatDate } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div
    class="flex items-start bg-[--gray-f7] px-[15px] t:w-full tm:items-center tm:py-[12px] pt:shrink-0 p:w-[160px] p:flex-col p:justify-center p:space-y-[5px]"
  >
    <time :datetime="props.item.date" class="text-[16px] tm:grow">
      {{ onFormatDate(props.item.date, 'YYY') }} / {{ onFormatDate(props.item.date, 'MM') }}
    </time>
    <BuyMAnchor
      :text="`${props.item.recordCount} 筆交易記錄`"
      :config="{
        icon: 'chevron_right',
      }"
      :setClass="{
        main: 'gap-x-[3px] text-[--gray-999] underline tm:shrink-0',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px] p-[2px]',
      }"
    />
  </div>
</template>

<style lang="postcss"></style>
