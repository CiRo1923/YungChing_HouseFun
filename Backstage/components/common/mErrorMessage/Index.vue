<script setup>
import './.css/common.css'

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
