<script setup>
const emits = defineEmits(['click', 'click:routePush'])

const onClick = () => {
  emits('click')
}

const onRoutePush = () => {
  emits('click:routePush')
}
</script>

<template>
  <div class="m:mt-[10px] pt:flex">
    <PageBuyListSearchCategory @click="onClick">
      <template #headerTools>
        <PageBuyListSearchSort @click:routePush="onRoutePush" />
      </template>
    </PageBuyListSearchCategory>
  </div>
</template>
