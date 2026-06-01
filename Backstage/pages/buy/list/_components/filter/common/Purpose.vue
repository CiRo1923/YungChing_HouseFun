<script setup>
const buyList = useBuyListStore()
const { apiData, options } = storeToRefs(buyList)
</script>

<template>
  <BuyMFormSelect
    name="purposeToken"
    v-model="apiData.purposeToken"
    :options="options.purpose"
    :config="{
      placeholder: '選擇用途',
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 p:w-[115px]',
      dropdown: 't:w-[300px] p:w-[400px]',
    }"
  />
</template>

<style lang="postcss"></style>
