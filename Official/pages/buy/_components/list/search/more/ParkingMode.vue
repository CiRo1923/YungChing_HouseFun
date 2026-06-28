<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const { onResolveByDevice } = useBuyProjectActions()
const buyList = useBuyListStore()
const { apiSearchData, parking } = storeToRefs(buyList)

const onChange = (data) => {
  const { value, label } = data

  parking.value.label = value ? label : onResolveByDevice(parking.value.defaultLabel, device.value)
}

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <ul class="space-y-[20px]">
    <li v-for="(item, index) in options.parkingMode" :key="`parking_${item.value}_${index}`">
      <BuyMFormCheckBox
        name="parking"
        v-model="apiSearchData.parking"
        :config="{
          label: item.text,
          value: item.value,
          valueClickClear: '',
          isJoin: true,
        }"
        :setClass="{
          main: '--icon-size-20 --checkbox-green-8d0d',
        }"
        @change="onChange"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
