<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onResolveByDevice } = useBuyProjectActions()
const buyList = useBuyListStore()
const {
  apiSearchData,
  region,
  mrt,
  purpose,
  price,
  room,
  type,
  pin,
  parking,
  age,
  floor,
  unitPrice,
  face,
  nearBy,
} = storeToRefs(buyList)
const { isChannelRegion, isChannelMrt, onParseFilters } = useBuyListActions()

// const route = useRoute()
const labels = {
  region: region.value.label,
  mrt: mrt.value.label,
  purpose: purpose.value.label,
  price: price.value.label,
  room: room.value.label,
  type: type.value.label,
  pin: pin.value.label,
  parking: parking.value.label,
  age: age.value.label,
  floor: floor.value.label,
  unitPrice: unitPrice.value.label,
  face: face.value.label,
  nearBy: nearBy.value.label,
}
const isDeviceM = computed(() => device.value === 'm')
const datas = computed(() => {
  const parseFilters = onParseFilters()
  const onLabel = (name, key, data) => {
    const parseValue = parseFilters[name]
    const value = apiSearchData.value[name]
    if (parseValue && parseValue === value) return data.label
    if (parseValue && parseValue !== value) return labels[key]

    return onResolveByDevice(data.defaultLabel, device.value)
  }

  const regionData = isChannelRegion.value
    ? parseFilters.region === region.value.ids
      ? [region.value.label]
      : [labels.region]
    : []
  const mrtnData = isChannelMrt.value
    ? parseFilters.mrt === mrt.value.ids
      ? [mrt.value.label]
      : [labels.mrt]
    : []

  const purposeData = onLabel('purpose', 'purpose', purpose.value)
  const priceData = onLabel('price', 'price', price.value)
  const roomData = onLabel('room', 'room', room.value)
  const typeData = onLabel('type', 'type', type.value)
  const pinData = onLabel(pin.value.type, 'pin', pin.value)
  const parkingModeData = onLabel('parking', 'parking', parking.value)
  const ageData = onLabel('age', 'age', age.value)
  const floorData = onLabel('floor', 'floor', floor.value)
  const unitPriceData = onLabel('uniprice', 'unitPrice', unitPrice.value)
  const faceData = onLabel('dt', 'face', face.value)
  const nearByData = onLabel('ft', 'nearBy', nearBy.value)
  const result = [
    ...regionData,
    ...mrtnData,
    purposeData,
    priceData,
    roomData,
    typeData,
    pinData,
    parkingModeData,
    ageData,
    floorData,
    unitPriceData,
    faceData,
    nearByData,
  ]

  return result.filter((item) => item).join('、')
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
  <div class="flex m:hidden p:text-[14px]" v-if="!isDeviceM">
    <b>您目前查詢的是：</b>
    <p>{{ datas }}</p>
  </div>
</template>

<style></style>
