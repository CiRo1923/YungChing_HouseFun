<script setup>
const buyList = useBuyListStore()
const { apiSearchData, serachOptions } = storeToRefs(buyList)
const { onApiPromise } = useBuyPopupActions()

const emits = defineEmits(['search'])

const onSearchClick = async () => {
  onApiPromise('open')
  await new Promise((resolve) => {
    emits('search', resolve)
  })
  onApiPromise('close')
}
</script>

<template>
  <PageBuyListFilterCommonAccordion @search="onSearchClick">
    <PageBuyListFilterCommonPurpose />
    <template #hide>
      <PageBuyListFilterCommonArea />
      <BuyMFormSelect
        name="exchangeToken"
        v-model="apiSearchData.exchangeToken"
        :options="serachOptions.exchange"
        :config="{
          placeholder: '選擇刊登類型',
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
      <BuyMFormSelect
        name="goldenToken"
        v-model="apiSearchData.goldenToken"
        :options="serachOptions.golden"
        :config="{
          placeholder: '選擇廣告狀態',
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
      <PageBuyListFilterCommonMore />
      <PageBuyListFilterCommonSearch />
    </template>
  </PageBuyListFilterCommonAccordion>
</template>

<style lang="postcss"></style>
