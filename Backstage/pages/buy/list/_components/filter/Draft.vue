<script setup>
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
      <PageBuyListFilterCommonMore />
      <PageBuyListFilterCommonSearch @search="searchFun" />
    </template>
  </PageBuyListFilterCommonAccordion>
</template>

<style lang="postcss"></style>
