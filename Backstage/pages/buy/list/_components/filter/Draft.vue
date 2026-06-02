<script setup>
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
      <PageBuyListFilterCommonMore />
      <PageBuyListFilterCommonSearch />
    </template>
  </PageBuyListFilterCommonAccordion>
</template>

<style lang="postcss"></style>
