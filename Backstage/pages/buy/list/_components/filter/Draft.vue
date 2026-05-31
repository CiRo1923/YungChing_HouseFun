<script setup>
const emits = defineEmits(['search'])

const onSearchClick = () => {
  emits('search')
}
</script>

<template>
  <PageBuyListFilterAccordion @search="onSearchClick">
    <PageBuyListFilterPurpose />
    <template #hide>
      <PageBuyListFilterAddr />
      <PageBuyListFilterMore />
      <PageBuyListFilterSearch />
    </template>
  </PageBuyListFilterAccordion>
</template>

<style lang="postcss"></style>
