<script setup>
const emits = defineEmits(['delete'])

const onDelete = () => emits('delete')
</script>

<template>
  <!-- 只有「刪除」一顆的那幾種通知共用(關注社區新上架、社區新行情、實登新行情)。
    桌機在右側;手機滿版,以上框線與內容隔開。 -->
  <div class="m:border-t-[1px] m:border-t-[--gray-e5] m:pt-[10px] pt:shrink-0">
    <CommonMAnchor
      text="刪除"
      :config="{
        icon: {
          name: 'icon_trash_can',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--oval --bg-white --border-gray-e5 --px-15 --text-gray-666 --text-center m:--h-35 pt:--h-25 gap-x-[5px] m:w-full',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px] p-[2px]',
      }"
      @click="onDelete"
    />
  </div>
</template>
