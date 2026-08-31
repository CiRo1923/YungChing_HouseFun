<script setup>
const buyList = useBuyListStore()
const { apiSearchData, serachOptions, offline } = storeToRefs(buyList)
const { onApiPromise } = usePopupActions()

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
    <template #hide="{ searchFun }">
      <PageBuyListFilterCommonArea />
      <CommonMFormSelect
        name="caseDownToken"
        v-model="apiSearchData.caseDownToken"
        :options="serachOptions.down"
        :config="{
          placeholder: '選擇下架原因',
          schema: {
            label: 'text',
            value: 'value',
          },
        }"
        :setClass="{
          type: 'text-[16px]',
          main: '--h-40 --px-12 --py-8 p:w-[150px]',
          dropdown: 't:w-[300px] p:w-[400px]',
        }"
      />
      <CommonMFormSelect
        name="is7DayExpirerFilterer"
        v-model="apiSearchData.is7DayExpirerFilterer"
        :options="offline.expirer7DayOptions"
        :config="{
          placeholder: '選擇刊登期狀態',
        }"
        :setClass="{
          type: 'text-[16px]',
          main: '--h-40 --px-12 --py-8 p:w-[150px]',
          dropdown: 't:w-[300px] p:w-[400px]',
        }"
      />
      <PageBuyListFilterCommonMore />
      <PageBuyListFilterCommonSearch @search="searchFun" />
    </template>
  </PageBuyListFilterCommonAccordion>
</template>

<style lang="postcss"></style>
