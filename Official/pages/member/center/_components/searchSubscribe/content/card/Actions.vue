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
  <!-- 規格書第七節的功能兩項:查看(另開帶入這組條件的買屋搜尋頁)與刪除。
    這一頁的卡片沒有標題可以當連結,所以查看是進到搜尋結果的唯一入口,不像另外兩頁可以省掉。 -->
  <div class="flex gap-[10px] m:w-full pt:shrink-0 pt:flex-col">
    <CommonMAnchor
      text="查看"
      :href="props.item.conditionPath"
      :config="{
        // 具名分頁:一份清單連看十組條件只會佔用一個分頁,第二筆之後換掉那個分頁的內容。
        // 與物件明細用的不是同一個名稱 —— 兩種頁面各自佔一個分頁,不互相蓋掉。
        target: 'buySearch',
        icon: {
          name: 'icon_open_link',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--oval --bg-white --border-gray-e5 --h-35 --px-15 --text-gray-666 --text-center gap-x-[5px] m:flex-1',
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
        main: '--oval --bg-white --border-gray-e5 --h-35 --px-15 --text-gray-666 --text-center gap-x-[5px] m:flex-1',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px] p-[2px]',
      }"
      @click="onDelete"
    />
  </div>
</template>
