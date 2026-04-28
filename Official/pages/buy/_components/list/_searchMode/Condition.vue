<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyListActions from '@stores/buy/composables/useListActions.js'

const project = useBuyProjectStore()
const { device } = storeToRefs(project)
const buyList = useBuyListStore()
const { region, mrt, purpose, price, room } = storeToRefs(buyList)
const { onResize } = useBuyProjectActions()
const { isChannelRegion, isChannelMrt, onParseFilters } = useBuyListActions()
// const route = useRoute()
const labels = {
  region: region.value.label,
  mrt: mrt.value.label,
  purpose: purpose.value.label,
  price: price.value.label,
  room: room.value.label,
}
const isDeviceM = computed(() => device.value === 'm')
const datas = computed(() => {
  const parseFilters = onParseFilters()
  // const onText = (options, params) => {
  //   const array = params.split(',')
  //   const textArray = array.map((item) => onValueGetText(options, item).name)

  //   return textArray
  // }

  const regionData = isChannelRegion.value
    ? parseFilters.region === region.value.apiData
      ? [region.value.label]
      : [labels.region]
    : []
  const mrtnData = isChannelMrt.value
    ? parseFilters.mrt === mrt.value.apiData
      ? [mrt.value.label]
      : [labels.mrt]
    : []

  const purposeData = parseFilters.purpose
    ? parseFilters.purpose === purpose.value.apiData
      ? purpose.value.label
      : labels.purpose
    : purpose.value.defaultLabel
  const priceData = parseFilters.price
    ? parseFilters.price === price.value.apiData
      ? price.value.label
      : labels.price
    : price.value.defaultLabel
  const roomData = parseFilters.room
    ? parseFilters.room === room.value.apiData
      ? room.value.label
      : labels.room
    : room.value.defaultLabel
  const result = [...regionData, ...mrtnData, purposeData, priceData, roomData]

  return result.filter((item) => item).join('、')
})

onBeforeUnmount(() => {
  onResize('remove')
})

onMounted(() => {
  onResize('add')
})
</script>

<template>
  <div class="flex m:hidden p:text-[14px]" v-if="!isDeviceM">
    <b>您目前查詢的是：</b>
    <p>{{ datas }}</p>
  </div>
</template>

<style></style>
