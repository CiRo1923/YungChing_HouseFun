<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const brokerInfo = computed(() => {
  const { name, shopName, mobilePhone } = props.item.broker || {}

  return [
    {
      id: 'name',
      value: [name, shopName].filter(Boolean).join(' '),
      isHidden: !name && !shopName,
    },
    {
      id: 'mobilePhone',
      value: mobilePhone,
      isHidden: !mobilePhone,
    },
  ]
})
</script>

<template>
  <CommonMSeparator
    :items="brokerInfo"
    :setClass="{
      main: 'pt:--horizontal --gap-x-30 text-[14px] text-[--gray-999]',
    }"
    v-if="props.item.broker"
  />
</template>
