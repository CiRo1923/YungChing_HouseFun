<script setup>
const props = defineProps({
  message: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <small class="m-error-message block">
    {{ props.message }}
  </small>
</template>

<style></style>
