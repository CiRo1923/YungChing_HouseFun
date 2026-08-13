<script setup>
const props = defineProps({
  message: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <div
    class="rounded-[10px] bg-[--orange-feea] px-[20px] py-[15px] text-[16px] text-[--red-d111]"
    v-html="props.message"
  />
</template>

<style lang="postcss"></style>
