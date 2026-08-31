<script setup>
import '@css/_modules/buy/mErrorMessage/common.css'

const props = defineProps({
  message: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <small class="m-error-message">
    {{ props.message }}
  </small>
</template>
