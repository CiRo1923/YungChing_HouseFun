<script setup>
const emits = defineEmits(['search'])

const buyList = useBuyListStore()
const { apiCommentsData } = storeToRefs(buyList)

const onEnter = () => {
  emits('search')
}
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
    @keydown.enter="onEnter"
  />
</template>

<style lang="postcss"></style>
