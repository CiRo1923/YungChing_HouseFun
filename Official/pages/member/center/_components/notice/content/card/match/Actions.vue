<script setup>
const emits = defineEmits(['delete'])

const onDelete = () => emits('delete')
</script>

<template>
  <!-- 照搜尋訂閱管理的做法:桌機直排(查看在上);手機橫排、各佔一半(刪除在左)—— 靠 order 對調。
    手機設計稿只畫了「刪除」,規格書與桌機都有「查看」,以規格書為準。 -->
  <div class="flex m:w-full m:gap-x-[10px] pt:shrink-0 pt:flex-col pt:gap-y-[5px]">
    <!-- 規格書:另開該配對條件的搜尋結果頁。通知的 api 沒有那個網址的欄位,
      已列進 api 待確認文件;拿到之前不掛網址。 -->
    <CommonMAnchor
      text="查看"
      :config="{
        // 具名分頁:與搜尋訂閱管理的「查看」同一個名稱,兩邊開的是同一種頁面。
        target: 'buySearch',
        icon: {
          name: 'icon_open_link',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--oval --bg-white --border-gray-e5 --px-15 --text-gray-666 --text-center m:--h-35 pt:--h-25 gap-x-[5px] m:order-2 m:flex-1',
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
