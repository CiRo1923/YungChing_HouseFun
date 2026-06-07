<script setup>
const buyList = useBuyListStore()
const { commentsDatas, commentsPagination, apiCommentsData } = storeToRefs(buyList)
const { onCommentSearch } = useBuyListActions()
const { onPromise } = usePopupActions()

const datas = computed(() => commentsDatas.value ?? [])
const hasData = computed(() => datas.value?.length !== 0)

const onClick = async (page) => {
  apiCommentsData.value.page = page

  onPromise('open')
  // 不關閉重開彈窗，直接重新搜尋並更新內容（不顯示 onApiPromise loading）
  await onCommentSearch()

  onPromise('close')
}
</script>
<template>
  <BuyMPagination
    :config="{
      nowPage: commentsPagination.page,
      itemsPage: commentsPagination.pageSize,
      pageNumber: 5,
      total: commentsPagination.total,
    }"
    :setClass="{
      main: 'tm:mt-[32px] p:mt-[40px]',
    }"
    @click="onClick"
    v-if="hasData"
  />
</template>

<style lang="postcss"></style>
