<script setup>
import '@css/_modules/common/mErrorMessage/variables.css'
import '@css/_modules/common/mErrorMessage/common.css'

const props = defineProps({
  message: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <small class="m-error-message">
    <CommonSvgIcon icon="icon_exclamation_o" class="m-error-message-icon" />
    <em>{{ props.message }}</em>
  </small>
</template>
