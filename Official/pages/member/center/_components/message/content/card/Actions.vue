<script setup>
const emits = defineEmits(['delete'])
</script>

<template>
  <!-- 規格書第六節的功能只有兩項:查看與刪除。查看由標題那個連結承擔
    (兩者都是開同一個物件明細頁,同一張卡片放兩個入口分不出差別),所以這裡只剩刪除。 -->
  <div class="flex gap-[10px] m:w-full pt:shrink-0 pt:flex-col">
    <CommonMAnchor
      text="刪除"
      :config="{
        icon: {
          name: 'icon_trash_can',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--oval --border-gray-e5 --h-35 --px-15 --text-gray-666 --text-center gap-x-[5px] m:flex-1',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px] p-[2px]',
      }"
      @click="emits('delete')"
    />
  </div>
</template>
