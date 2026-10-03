<script setup>
const emits = defineEmits(['delete'])

const onDelete = () => emits('delete')
</script>

<template>
  <!-- 桌機直排(留言在上);手機橫排、各佔一半(刪除在左)—— 靠 order 對調 -->
  <div class="flex m:w-full m:gap-x-[10px] pt:shrink-0 pt:flex-col pt:gap-y-[5px]">
    <!-- 留言要開留言燈箱,那一支目前綁在買屋頻道,而且要 hfid;接上之前先不掛行為。 -->
    <CommonMAnchor
      text="留言"
      :config="{
        icon: {
          name: 'icon_dialogue',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--oval --bg-white --border-orange-f74c --px-15 --text-orange-e646 --text-center m:--h-35 pt:--h-25 gap-x-[5px] m:order-2 m:flex-1',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px] p-[2px]',
      }"
    />
    <CommonMAnchor
      text="刪除"
      :config="{
        icon: {
          name: 'icon_trash_can',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--oval --bg-white --border-gray-e5 --px-15 --text-gray-666 --text-center m:--h-35 pt:--h-25 gap-x-[5px] m:order-1 m:flex-1',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px] p-[2px]',
      }"
      @click="onDelete"
    />
  </div>
</template>
