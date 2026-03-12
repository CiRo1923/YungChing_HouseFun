<script setup>
const props = defineProps({
  icon: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <svg class="fill-current">
    <use :xlink:href="`#${props.icon}`" />
  </svg>
</template>

<style lang="postcss"></style>
