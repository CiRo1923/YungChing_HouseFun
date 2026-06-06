<script setup>
const buyList = useBuyListStore()
const { apiCommentsData, commentsOptions } = storeToRefs(buyList)
</script>

<template>
  <BuyMFormSelect
    name="caseCommentTypeToken"
    v-model="apiCommentsData.caseCommentTypeToken"
    :options="commentsOptions.type"
    :config="{
      placeholder: '選擇類型',
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 p:w-[150px]',
      dropdown: 't:w-[300px] p:w-[400px]',
    }"
  />
</template>

<style lang="postcss"></style>
