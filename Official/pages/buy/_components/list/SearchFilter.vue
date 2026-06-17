<script setup>
const emits = defineEmits(['click'])

const onClick = () => {
  emits('click')
}
</script>

<template>
  <div class="m:bg-[--gray-f7] m:py-[10px] tm:mb-[20px] pt:flex p:mb-[30px]">
    <PageBuyListSearchCategory @click="onClick">
      <template #headerTools>
        <PageBuyListSearchSort />
      </template>
    </PageBuyListSearchCategory>
  </div>
</template>

<style></style>
