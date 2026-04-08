<script setup>
import { useProjectStore } from '@stores/buy/project.js'
import { useListStore } from '@stores/buy/list.js'
import useProjectStores from '@stores/buy/_composables/useProjectStores.js'

const project = useProjectStore()
const list = useListStore()
const { device } = storeToRefs(project)
const { region, mrt, purpose, price, room } = storeToRefs(list)
const { onValueGetText, onResize } = useProjectStores()
const route = useRoute()

const isDeviceM = computed(() => device.value === 'm')
const isChannelRegion = computed(() => route.meta.channel === 'region')
const isChannelMrt = computed(() => route.meta.channel === 'mrt')
const datas = computed(() => {
  const onText = (options, params) => {
    const array = params.split(',')
    const textArray = array.map((item) => onValueGetText(options, item).name)

    return textArray
  }

  const regionData =
    isChannelRegion.value && region.value.params
      ? onText(region.value.options, region.value.params)
      : []
  const mrtnData =
    isChannelMrt.value && mrt.value.params ? onText(mrt.value.options, mrt.value.params) : []
  const purposeData = purpose.value.params
    ? onValueGetText('casePurpose', purpose.value.params).text
    : purpose.value.defaultLabel
  const roomData = room.value.params ? `${room.value.params} 房` : room.value.defaultLabel
  const result = [...regionData, ...mrtnData, purposeData, price.value.label, roomData]

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
