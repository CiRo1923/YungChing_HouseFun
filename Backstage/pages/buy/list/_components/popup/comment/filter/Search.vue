<script setup>
const buyList = useBuyListStore()
const { apiCommentsData } = storeToRefs(buyList)
</script>

<template>
  <BuyMFormSearch
    name="commentsSearchKey"
    v-model="apiCommentsData.searchKey"
    :config="{
      placeholder: '搜尋姓名、手機',
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 pt:flex-1',
    }"
  />
</template>

<style lang="postcss"></style>
