<script setup>
const memberCenter = useMemberCenterStore()
const { houseSubscribe } = storeToRefs(memberCenter)
const { onApiDeleteMemberSubscriptionsBuyObjects, onApiPostMemberCompareBuyObjectsItems } =
  useMemberCenterActions()
const { onAlert, onConfirm } = usePopupActions()

const emits = defineEmits(['changed'])
// 選取的是哪幾筆 —— 畫面狀態,不進 store。換頁重新取清單時一併清掉。
const selectedIds = ref([])
const items = computed(() => houseSubscribe.value.data?.items || [])
const paging = computed(() => houseSubscribe.value.data?.paging || {})
// 一次最多能比較幾筆,由清單那一支 api 回。
const compareLimit = computed(() => houseSubscribe.value.data?.compareLimit || 0)
// 選超過上限就擋在前端,不送出去讓後端退。
const isCompareDisabled = computed(
  () => selectedIds.value.length === 0 || selectedIds.value.length > compareLimit.value
)

watch(items, () => {
  selectedIds.value = []
})

// 刪除前一律先確認,刪完重新取清單(頁碼可能因此變動,由頁面決定)。
const onDelete = async (ids) => {
  const { isSure } = await onConfirm({
    title: '刪除提醒',
    content: '您刪除的物件訂閱將無法復原',
    btns: [
      {
        type: 'sure',
        label: '確定刪除',
      },
    ],
  })

  if (!isSure) return

  const { status } = await onApiDeleteMemberSubscriptionsBuyObjects(ids)

  if (status === 200) emits('changed')
}

// 成功與失敗的文字都用後端回的 message —— 上限與重複加入只有後端知道。
const onCompare = async (ids) => {
  const { data } = await onApiPostMemberCompareBuyObjectsItems(ids)

  await onAlert({
    content: data?.message,
  })
}
</script>

<template>
  <!-- 手機的批次列固定在畫面底部,底下要留出它的高度(上下內距 12 加上按鈕 35),
    否則它會蓋住分頁器。那一列的內距或按鈕高度改了,這個值要跟著改。 -->
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
    <li>
      <CommonMAnchor
        text="加入比較"
        :config="{
          isDisabled: isCompareDisabled,
        }"
        :setClass="{
          main: '--oval --bg-white --border-gray-e5 --px-15 --text-gray-666 m:--h-35 pt:--h-25',
          text: 'text-[14px]',
        }"
        @click="onCompare(selectedIds)"
      />
    </li>
  </PageMemberCenterBatch>
  <ul class="mt-[10px] m:space-y-[12px] pt:divide-y-[1px] pt:divide-[--gray-e5]">
    <li v-for="item in items" :key="item.id">
      <PageMemberCenterHouseSubscribeContentCard
        :item="item"
        v-model="selectedIds"
        @compare="onCompare([item.id])"
        @delete="onDelete([item.id])"
      />
    </li>
  </ul>
  <CommonMPagination
    :route="{
      name: 'member-center-house-subscribe',
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
