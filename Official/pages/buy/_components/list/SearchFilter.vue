<script setup>
const emits = defineEmits(['click'])

const onClick = () => {
  emits('click')
}
</script>

<template>
  <div class="m:mt-[10px] pt:flex">
    <PageBuyListSearchCategory @click="onClick">
      <template #headerTools>
        <PageBuyListSearchSort />
      </template>
    </PageBuyListSearchCategory>
  </div>
</template>

<style></style>
