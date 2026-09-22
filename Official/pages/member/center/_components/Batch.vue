<script setup>
// 清單的批次列:全選、已選筆數,以及使用端放進來的那幾顆操作按鈕。
// 選取的是整份清單的狀態,所以值由使用端持有,這裡只負責全選與顯示。
//
// 桌機在清單上方,手機固定在畫面底部 —— 手機捲到清單中段時,上方那一列早就捲出畫面,
// 勾了幾筆、要按哪一顆都看不到。固定在底部的話操作一直在手邊。
//
// 這裡只顯示「已選幾筆」,不顯示總筆數 —— 設計稿的手機版寫成「已選 / 總數」,
// 但總筆數破萬時那一串會長到擠掉旁邊的按鈕,而且使用者要決定的是「這幾筆要不要刪」,
// 總共有幾筆對那個決定沒有作用。
// 手機的按鈕靠右也是同一件事:已選筆數從 9 變成 10 時字寬會變,
// 跟在筆數後面的話整排按鈕會被推著走。桌機那一列寬度夠,按鈕就接在筆數後面。
//
// 勾選框給白底,兩個斷點才能用同一種配色 —— 沒有底色的話,勾號在手機那條綠底上
// 與底色同色、看不見,而改成白勾又會在桌機的灰底上不見。
const selectedIds = defineModel({
  type: Array,
  default: () => [],
})
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const isAllSelected = computed(
  () => props.items.length > 0 && selectedIds.value.length === props.items.length
)

const onToggleAll = () => {
  selectedIds.value = isAllSelected.value ? [] : props.items.map(({ id }) => id)
}
</script>

<template>
  <CommonMFixedBar
    class="flex items-center py-[12px] m:--fixed m:bg-[--green-8b0d] m:px-[16px] tm:gap-x-[10px] pt:rounded-[5px] pt:bg-[--gray-f7] pt:px-[15px] p:gap-x-[15px]"
  >
    <CommonMFormCheckBox
      name="batchAll"
      :modelValue="isAllSelected"
      :config="{
        mode: 'boolean',
      }"
      :setClass="{
        main: '--checkbox-green-8d0d',
        icon: 'bg-[--white]',
      }"
      @update:modelValue="onToggleAll"
    >
      <p class="text-[16px] m:text-[--white]">
        共
        <b class="m:text-[--white] pt:text-[--orange-f74c]">{{ selectedIds.length }}</b>
        筆
      </p>
    </CommonMFormCheckBox>
    <ul class="flex items-center gap-x-[8px] m:ml-auto">
      <slot />
    </ul>
  </CommonMFixedBar>
</template>
