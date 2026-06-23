<script setup>
const props = defineProps({
  ids: {
    type: Array,
    default: () => [],
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const items = computed(() => {
  const defaultItems = [
    {
      id: 'new',
      label: 'NEW',
      class: '--bg-orange-f74c --text-white --text-shadow',
    },
  ]
  return defaultItems.filter((item) => props.ids.includes(item.id))
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})
</script>

<template>
  <ul class="absolute z-[1] flex items-center" :class="setClass.main">
    <li v-for="(item, index) in items" :key="`${item.id}_${index}`">
      <BuyMTagDefault
        :label="item.label"
        :setClass="{
          main: ['--rounded-3 --px-6 --py-4', item.class],
          label: 'text-[12px]',
        }"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
