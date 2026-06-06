<script setup>
const buyList = useBuyListStore()
const { commentsDatas, commentsPagination } = storeToRefs(buyList)
const datas = computed(() => commentsDatas.value ?? [])
const hasData = computed(() => datas.value?.length !== 0)
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
    v-if="hasData"
  />
</template>

<style lang="postcss"></style>
