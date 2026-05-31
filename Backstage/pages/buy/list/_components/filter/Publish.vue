<script setup>
const buyList = useBuyListStore()
const { apiData, options } = storeToRefs(buyList)

const emits = defineEmits(['search'])

const onSearchClick = () => {
  console.log('Publish search')
  emits('search')
}
</script>

<template>
  <PageBuyListFilterAccordion @search="onSearchClick">
    <PageBuyListFilterPurpose />
    <template #hide>
      <BuyMFormSelect
        name="exchangeToken"
        v-model="apiData.exchangeToken"
        :options="options.exchange"
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
        v-model="apiData.goldenToken"
        :options="options.golden"
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
      <PageBuyListFilterMore />
      <PageBuyListFilterSearch />
    </template>
  </PageBuyListFilterAccordion>
</template>

<style lang="postcss"></style>
