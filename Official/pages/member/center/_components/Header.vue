<script setup>
const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <header
    class="m:text-center t:gap-x-[5px] tm:mb-[10px] pt:flex pt:items-end p:mb-[20px] p:gap-x-[10px]"
  >
    <h2 class="leading-[1.5] tm:text-[24px] p:text-[30px]">
      <strong>{{ props.title }}</strong>
    </h2>
    <p class="text-[14px] leading-[2] tracking-wider text-[--gray-999]" v-if="props.description">
      {{ props.description }}
    </p>
  </header>
</template>
