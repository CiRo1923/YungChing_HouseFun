<script setup>
import Item from '@components/buy/mItem/Main.vue'
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <Item
    :data="props.data"
    :setClass="{
      main: 'text-[14px] text-[--gray-666]',
      item: 'tracking-[0.043em]',
    }"
  />
</template>

<style></style>
