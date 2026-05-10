<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})
</script>

<template>
  <BuyMItemMain
    :data="props.data"
    :setClass="{
      main: setClass.main,
      container: 'text-[14px] text-[--gray-666]',
      item: 'tracking-[0.043em]',
    }"
  />
</template>

<style></style>
