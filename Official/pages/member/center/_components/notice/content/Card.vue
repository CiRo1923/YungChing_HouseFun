<script setup>
// 五個分頁共用的外殼:左邊的已讀 / 未讀圖示與卡片外框。
// 主體依分頁各一支 —— 其中一類要多一個欄位時,不會動到別類。
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
  <div
    class="transition-colors duration-300 m:space-y-[10px] m:rounded-[10px] m:bg-[--white] m:p-[15px] pt:flex pt:items-center pt:gap-x-[20px] pt:px-[10px] pt:py-[15px] pt:hover:bg-[--gray-f7]"
  >
    <CommonMSvgIcon
      :icon="props.item.isRead ? 'icon_mail_check' : 'icon_mail_point'"
      class="h-[24px] w-[24px] shrink-0"
      :class="props.item.isRead ? 'text-[--gray-666]' : 'text-[--orange-e646]'"
    />
    <PageMemberCenterNoticeContentCardPrice
      :item="props.item"
      @delete="onDelete"
      v-if="props.item.category === 0"
    />
    <PageMemberCenterNoticeContentCardMatch
      :item="props.item"
      @delete="onDelete"
      v-else-if="props.item.category === 1"
    />
    <PageMemberCenterNoticeContentCardCommunityNew
      :item="props.item"
      @delete="onDelete"
      v-else-if="props.item.category === 2"
    />
  </div>
</template>
