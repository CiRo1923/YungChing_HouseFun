<script setup>
const buyList = useBuyListStore()
const { apiData, options } = storeToRefs(buyList)
const emits = defineEmits(['search'])

const onSearchClick = () => {
  emits('search')
}
</script>

<template>
  <PageBuyListFilterCommonAccordion @search="onSearchClick">
    <PageBuyListFilterCommonPurpose />
    <template #hide>
      <PageBuyListFilterCommonArea />
      <BuyMFormSelect
        name="caseDealShowToken"
        v-model="apiData.caseDealShowToken"
        :options="options.dealShow"
        :config="{
          placeholder: '選擇實績',
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
