<script setup>
const props = defineProps({
  message: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <div class="flex items-center justify-center gap-x-[5px] text-[--gray-333]">
    <CommonSvgIcon icon="icon_exclamation_o" class="h-[20px] w-[20px] shrink-0" />
    <p class="text-[16px]" v-html="props.message" />
  </div>
</template>
