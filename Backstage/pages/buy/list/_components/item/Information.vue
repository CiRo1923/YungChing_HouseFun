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

// 1: 住宅 2: 店面 3: 住店 4: 辦公 5: 住辦 6: 廠房 7: 車位 8: 土地 9: 其他
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

  const common = [
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
      isHidden: room + livingRoom + bathroom === 0,
    },
  ]
  const parking = [
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
  ]
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
    1: common,
    2: common,
    3: common,
    4: common,
    5: common,
    6: common,
    7: parking,
    8: land,
    9: common,
  }

  return result[casePurposeToken] ?? []
})

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>
<template>
  <!-- {{ props.data.casePurposeToken }} -->
  <!-- <pre>{{ items }}</pre> -->
  <BuyMSeparator
    :items="items"
    :setClass="{
      main: '--horizontal --gap-x-16 text-[--gray-666]',
      item: 'text-[14px]',
    }"
  />
</template>
<style lang="postcss"></style>
