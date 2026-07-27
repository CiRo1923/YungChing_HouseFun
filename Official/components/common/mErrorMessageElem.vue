<script setup>
const props = defineProps({
  message: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <small class="m-error-message flex items-center gap-x-[4px] text-[--red-d111]">
    <CommonSvgIcon icon="icon_exclamation_o" class="h-[18px] w-[18px]" />
    <em>{{ props.message }}</em>
  </small>
</template>

<style></style>
