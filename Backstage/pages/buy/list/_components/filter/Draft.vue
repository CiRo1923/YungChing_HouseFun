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
      <PageBuyListFilterMore />
      <PageBuyListFilterSearch />
    </template>
  </PageBuyListFilterAccordion>
</template>

<style lang="postcss"></style>
