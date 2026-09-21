<script setup>
const memberCenter = useMemberCenterStore()
const { message } = storeToRefs(memberCenter)
const { onApiDeleteMemberMessages } = useMemberCenterActions()
const { onConfirm } = usePopupActions()

const emits = defineEmits(['deleted'])
// 選取的是哪幾筆 —— 畫面狀態,不進 store。換頁重新取清單時一併清掉。
const selectedIds = ref([])
const items = computed(() => message.value.data?.items || [])
const paging = computed(() => message.value.data?.paging || {})
const isAllSelected = computed(
  () => items.value.length > 0 && selectedIds.value.length === items.value.length
)

watch(items, () => {
  selectedIds.value = []
})

const onToggleAll = () => {
  selectedIds.value = isAllSelected.value ? [] : items.value.map(({ id }) => id)
}

// 刪除前一律先確認,刪完重新取清單(頁碼可能因此變動,由頁面決定)。
const onDelete = async (ids) => {
  const { isSure } = await onConfirm({
    title: '刪除提醒',
    content: '您刪除的留言紀錄將無法復原',
    btns: [{ type: 'sure', label: '確定刪除' }],
  })

  if (!isSure) return

  const { status } = await onApiDeleteMemberMessages(ids)

  if (status === 200) emits('deleted')
}
</script>

<template>
  <div class="space-y-[10px]">
    <div class="flex items-center gap-x-[24px] rounded-[5px] bg-[--gray-f7] px-[15px] py-[10px]">
      <CommonMFormCheckBox
        name="messageAll"
        :modelValue="isAllSelected"
        :config="{
          mode: 'boolean',
        }"
        :setClass="{
          main: '--checkbox-green-8d0d',
        }"
        @update:modelValue="onToggleAll"
      >
        <p class="text-[16px]">
          共
          <b class="text-[--orange-f74c]">{{ selectedIds.length }}</b>
          筆
        </p>
      </CommonMFormCheckBox>
      <CommonMAnchor
        text="刪除"
        :config="{
          isDisabled: selectedIds.length === 0,
        }"
        :setClass="{
          main: '--oval --border-gray-e5 --h-25 --px-15 --text-gray-666',
          text: 'text-[14px]',
        }"
        @click="onDelete(selectedIds)"
      />
    </div>
    <ul>
      <li
        class="border-b-[1px] border-b-[--gray-e5] last:border-b-0"
        v-for="item in items"
        :key="item.id"
      >
        <PageMemberCenterMessageContentCard
          :item="item"
          v-model="selectedIds"
          @delete="onDelete([item.id])"
        />
      </li>
    </ul>
    <CommonMPagination
      :route="{
        name: 'member-center-message',
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
  </div>
</template>
