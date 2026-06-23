<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const badges = computed(() => props.item.badges || {})
</script>

<template>
  <BuyMTagDefault
    label="黃金曝光"
    :setClass="{
      main: '--rounded-3 --bg-red-e45c --text-white --text-shadow --px-6 --py-4 shrink-0',
      label: 'text-[12px]',
    }"
    v-if="badges.gold"
  />
</template>

<style lang="postcss"></style>
