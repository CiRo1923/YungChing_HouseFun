<script setup>
import { onLayoutText, onFloorText } from '@js/_projectPrototype.js'

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

// API 的樓層值是絕對值,地上 / 地下由對應的 type 決定(1 地上、-1 地下)。
// type 沒給時視為地上,舊物件才不會整列消失。
const onSignedFloor = (value, type) => (value ? value * (type || 1) : value)

// 1: 住宅 2: 店面 3: 住店 4: 辦公 5: 住辦 6: 廠房 7: 車位 8: 土地 9: 其他
const items = computed(() => {
  const {
    casePurposeToken,
    casePurpose,
    caseAge,
    caseAreaPin,
    caseFloor,
    caseFloorTo,
    caseFloorType,
    caseFloorToType,
    caseTotalFloor,
    caseLayout,
  } = props.data
  const { room, livingRoom, bathroom } = caseLayout || {}
  // 手機版只顯示「房(室)」單一值,null / 0 直接整列隱藏(不補 `--`)
  // 桌機版為組合值,只要任一格有值就顯示,空的格以 `--` 呈現
  const layoutText = isDeviceM.value
    ? room
      ? `${room} 房 (室)`
      : null
    : onLayoutText({ room, living: livingRoom, bath: bathroom })
  // 樓層同為組合值,任一格缺值以 `--` 呈現,全空才整列隱藏。
  // 多層物件要帶 to 才會顯示成範圍(2 ~ 3 / 15 樓),只給 from 會只剩單層。
  const floorText = onFloorText({
    from: onSignedFloor(caseFloor, caseFloorType),
    to: onSignedFloor(caseFloorTo, caseFloorToType),
    up: caseTotalFloor,
  })

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
      value: floorText,
      isHidden: !floorText,
    },
    {
      id: 'layout',
      value: layoutText,
      isHidden: !layoutText,
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
      value: floorText,
      isHidden: !floorText,
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
