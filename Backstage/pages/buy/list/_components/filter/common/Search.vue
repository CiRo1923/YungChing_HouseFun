<script setup>
const emits = defineEmits(['search'])

const buyList = useBuyListStore()
const { apiSearchData } = storeToRefs(buyList)

const onEnter = () => {
  emits('search')
}
</script>

<template>
  <CommonMFormSearch
    name="searchKey"
    v-model="apiSearchData.searchKey"
    :config="{
      placeholder: '物件編號、地址、社區或案名',
    }"
    :setClass="{
      type: 'text-[16px]',
      main: '--h-40 --px-12 --py-8 p:flex-1',
    }"
    @keydown.enter="onEnter"
  />
</template>
