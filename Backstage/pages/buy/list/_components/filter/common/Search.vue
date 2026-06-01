<script setup>
const buyList = useBuyListStore()
const { apiData } = storeToRefs(buyList)
</script>

<template>
  <BuyMFormSearch
    name="searchKey"
    v-model="apiData.searchKey"
    :config="{
      placeholder: '物件編號、地址、社區或案名',
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 pt:flex-1',
    }"
  />
</template>

<style lang="postcss"></style>
