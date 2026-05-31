<script setup>
const buyList = useBuyListStore()
const { apiData, options } = storeToRefs(buyList)

const emits = defineEmits(['search'])

const onSearchClick = () => {
  emits('search')
}
</script>

<template>
  <PageBuyListFilterAccordion @search="onSearchClick">
    <PageBuyListFilterPurpose />
    <template #hide>
      <BuyMFormSelect
        name="caseDownToken"
        v-model="apiData.caseDownToken"
        :options="options.down"
        :config="{
          placeholder: '選擇下架原因',
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
