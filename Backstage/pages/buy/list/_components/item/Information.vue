<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})

const isDeviceM = computed(() => device.value === 'm')
const items = computed(() => {
  const {
    casePurposeToken,
    casePurpose,
    caseAge,
    caseAreaPin,
    caseFloor,
    caseTotalFloor,
    caseLayout,
  } = props.data
  const { room, livingRoom, bathroom } = caseLayout || {}
  const land = [
    {
      id: 'purpose',
      value: casePurpose,
      isHidden: !casePurpose,
    },
    {
      id: 'areaPin',
      value: `${caseAreaPin} 坪`,
      isHidden: !caseAreaPin,
    },
  ]
  const result = {
    1: [
      {
        id: 'purpose',
        value: casePurpose,
        isHidden: !casePurpose,
      },
      {
        id: 'age',
        value: `${caseAge} 年`,
        isHidden: !caseAge,
      },
      {
        id: 'areaPin',
        value: `${caseAreaPin} 坪`,
        isHidden: !caseAreaPin,
      },
      {
        id: 'floor',
        value: `${caseFloor} / ${caseTotalFloor} 樓`,
        isHidden: !caseFloor || !caseTotalFloor,
      },
      {
        id: 'layout',
        value: isDeviceM.value
          ? `${room} 房 (室)`
          : `${room} 房 (室) ${livingRoom} 廳 ${bathroom} 衛`,
        isHidden: !room || !livingRoom || !bathroom,
      },
    ],
    5: [
      {
        id: 'purpose',
        value: casePurpose,
        isHidden: !casePurpose,
      },
      {
        id: 'age',
        value: `${caseAge} 年`,
        isHidden: !caseAge,
      },
      {
        id: 'areaPin',
        value: `${caseAreaPin} 坪`,
        isHidden: !caseAreaPin,
      },
      {
        id: 'floor',
        value: `${caseFloor} / ${caseTotalFloor} 樓`,
        isHidden: !caseFloor || !caseTotalFloor,
      },
    ],
    6: land,
    F: land,
  }

  return result[casePurposeToken] ?? []
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})
</script>
<template>
  <!-- {{ props.data.casePurposeToken }} -->
  <BuyMSeparator
    :items="items"
    :setClass="{
      main: '--horizontal --gap-x-16 text-[--gray-666]',
      item: 'text-[14px]',
    }"
  />
</template>
<style lang="postcss"></style>
