<script setup>
// 配對物件新上架的主體。欄位依規格書 C203-1 §四「配對物件新上架」:
// 配對條件、通知時間、本日新上架戶數、功能(查看 / 刪除)。
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
  <div class="min-w-0 grow m:space-y-[10px] pt:flex pt:items-center pt:gap-x-[20px]">
    <div class="min-w-0 grow space-y-[3px]">
      <p class="text-[16px]">配對條件：{{ props.item.title }}</p>
      <PageMemberCenterNoticeContentCardSentAt :item="props.item" />
    </div>
    <PageMemberCenterNoticeContentCardMatchNewListing :item="props.item" />
    <PageMemberCenterNoticeContentCardMatchActions @delete="onDelete" />
  </div>
</template>
