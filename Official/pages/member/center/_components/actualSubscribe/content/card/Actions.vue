<script setup>
const emits = defineEmits(['delete'])
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const onDelete = () => emits('delete')
</script>

<template>
  <!-- 規格書第八節的功能兩項:查看(另開帶入這組條件的實價登錄搜尋頁)與刪除。
    這一頁的卡片沒有標題可以當連結,所以查看是進到搜尋結果的唯一入口。

    兩顆的順序在兩個斷點相反 —— 桌機直排是查看在上,手機橫排是刪除在左,
    所以手機那一側靠 order 對調。 -->
  <div class="flex m:w-full m:gap-x-[10px] pt:shrink-0 pt:flex-col pt:gap-y-[5px]">
    <CommonMAnchor
      text="查看"
      :href="props.item.conditionPath"
      :config="{
        // 具名分頁:一份清單連看十組條件只會佔用一個分頁,第二筆之後換掉那個分頁的內容。
        // 與買屋搜尋、物件明細各用一個名稱 —— 三種頁面各自佔一個分頁,不互相蓋掉。
        target: 'actualPriceSearch',
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
