<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <BuyMAnchor
    :text="`HF${props.data.hfID}`"
    :href="'javascript:;'"
    :setClass="{
      main: 'underline',
    }"
  />
</template>

<style lang="postcss"></style>
