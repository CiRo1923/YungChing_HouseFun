<script setup>
const buyList = useBuyListStore()
const { apiCommentsData, commentsOptions } = storeToRefs(buyList)
</script>

<template>
  <BuyMFormSelect
    name="statueToken"
    v-model="apiCommentsData.statueToken"
    :options="commentsOptions.status"
    :config="{
      placeholder: '選擇狀態',
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
