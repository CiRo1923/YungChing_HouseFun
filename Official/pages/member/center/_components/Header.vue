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
  <header class="t:gap-x-[5px] pt:flex pt:items-end p:gap-x-[10px]">
    <h2 class="leading-[1.5] tm:text-[24px] p:text-[30px]">
      <strong>{{ props.title }}</strong>
    </h2>
    <p class="text-[14px] leading-[2] tracking-wider text-[--gray-999]" v-if="props.description">
      {{ props.description }}
    </p>
  </header>
</template>
