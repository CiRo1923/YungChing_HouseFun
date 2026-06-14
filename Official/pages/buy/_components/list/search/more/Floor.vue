<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onResolveByDevice } = useBuyProjectActions()
const buyList = useBuyListStore()
const { apiSearchData, floor } = storeToRefs(buyList)

const onChange = (data) => {
  const { value, label } = data

  floor.value.min = null
  floor.value.max = null

  floor.value.label = value ? label : onResolveByDevice(floor.value.defaultLabel, device.value)
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
    <li v-for="(item, index) in floor.options" :key="`floor_${item.value}_${index}`">
      <BuyMFormRadio
        name="age"
        v-model="apiSearchData.floor"
        :config="{
          label: item.label,
          value: item.value,
        }"
        @change="onChange"
      />
    </li>
    <li>
      <PageBuyListSearchMaxMinRange
        name="floor"
        :data="floor"
        v-model:min="floor.min"
        v-model:max="floor.max"
        :config="{
          placeholder: {
            min: '最低',
            max: '最高',
          },
          schema: {
            api: 'floor',
          },
          suffix: floor.unit,
        }"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
