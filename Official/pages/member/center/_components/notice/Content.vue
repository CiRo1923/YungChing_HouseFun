<script setup>
const memberCenter = useMemberCenterStore()
const { onConfirm } = usePopupActions()

// 五個分頁共用這一支 —— id 是 noticeTabs 的 id,也是 store 裡那一層的層名。
const props = defineProps({
  id: {
    type: String,
    default: null,
  },
})

const tab = computed(() => memberCenter.noticeTabs.find((item) => item.id === props.id) || {})
const items = computed(() => memberCenter[props.id]?.data?.items || [])
const paging = computed(() => memberCenter[props.id]?.data?.paging || {})

// 刪除前一律先確認(規格書:此提示適用所有通知的刪除)。
// 確認之後要打的 DELETE /member/notifications 還沒有接 —— 清單現在是假資料,
// 刪了也看不到結果。接上時照留言紀錄的做法:刪完重新取清單。
const onDelete = async () => {
  await onConfirm({
    title: '刪除提醒',
    content: '您刪除的通知將無法復原',
    btns: [{ type: 'sure', label: '確定刪除' }],
  })
}
</script>

<template>
  <ul class="m:mt-[15px] m:space-y-[12px] pt:divide-y-[1px] pt:divide-[--gray-e5]">
    <li v-for="item in items" :key="item.id">
      <PageMemberCenterNoticeContentCard :item="item" @delete="onDelete" />
    </li>
  </ul>
  <CommonMPagination
    :route="tab.to"
    :config="{
      nowPage: paging.page,
      itemsPage: paging.pageSize,
      pageNumber: 5,
      total: paging.total,
      queryKey: 'pg',
    }"
    :setClass="{
      main: 'mt-[20px]',
    }"
  />
</template>
