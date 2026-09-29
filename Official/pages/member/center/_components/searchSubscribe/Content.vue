<script setup>
const memberCenter = useMemberCenterStore()
const { searchSubscribe } = storeToRefs(memberCenter)
const { onApiDeleteMemberSubscriptionsSearch } = useMemberCenterActions()
const { onConfirm } = usePopupActions()

const emits = defineEmits(['deleted'])
// 選取的是哪幾筆 —— 畫面狀態,不進 store。換頁重新取清單時一併清掉。
const selectedIds = ref([])
const items = computed(() => searchSubscribe.value.data?.items || [])
const paging = computed(() => searchSubscribe.value.data?.paging || {})

watch(items, () => {
  selectedIds.value = []
})

// 刪除前一律先確認,刪完重新取清單(頁碼可能因此變動,由頁面決定)。
const onDelete = async (ids) => {
  const { isSure } = await onConfirm({
    title: '刪除提醒',
    content: '您刪除的搜尋訂閱條件將無法復原',
    btns: [{ type: 'sure', label: '確定刪除' }],
  })

  if (!isSure) return

  const { status } = await onApiDeleteMemberSubscriptionsSearch(ids)

  if (status === 200) emits('deleted')
}
</script>

<template>
  <PageMemberCenterBatch v-model="selectedIds" :items="items">
    <li>
      <CommonMAnchor
        text="刪除"
        :config="{
          isDisabled: selectedIds.length === 0,
        }"
        :setClass="{
          main: '--oval --bg-white --border-gray-e5 --px-15 --text-gray-666 m:--h-35 pt:--h-25',
          text: 'text-[14px]',
        }"
        @click="onDelete(selectedIds)"
      />
    </li>
  </PageMemberCenterBatch>
  <ul class="mt-[10px] m:space-y-[12px] pt:divide-y-[1px] pt:divide-[--gray-e5]">
    <li v-for="item in items" :key="item.id">
      <PageMemberCenterSearchSubscribeContentCard
        :item="item"
        v-model="selectedIds"
        @delete="onDelete([item.id])"
      />
    </li>
  </ul>
  <CommonMPagination
    :route="{
      name: 'member-center-search-subscribe',
    }"
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
