<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const basicInfo = computed(() => {
  const { caseType } = props.item
  const { buildPing, roomText } = props.item.house || {}

  return [
    {
      id: 'caseType',
      value: caseType,
      isHidden: !caseType,
    },
    {
      id: 'buildPing',
      value: buildPing ? `${buildPing} 坪` : null,
      isHidden: !buildPing,
    },
    {
      id: 'roomText',
      value: roomText,
      isHidden: !roomText,
    },
  ]
})
</script>

<template>
  <CommonMSeparator
    :items="basicInfo"
    :setClass="{
      main: '--horizontal --gap-x-24 text-[14px] text-[--gray-666]',
    }"
  />
</template>
