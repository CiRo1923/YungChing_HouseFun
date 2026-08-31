<script setup>
const props = defineProps({
  anchor: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <BuyMToolbar :anchor="props.anchor">尚未刊登</BuyMToolbar>
</template>

<style></style>
