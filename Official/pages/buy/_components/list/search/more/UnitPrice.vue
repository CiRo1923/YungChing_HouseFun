<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onResolveByDevice } = useBuyProjectActions()
const buyList = useBuyListStore()
const { apiSearchData, unitPrice } = storeToRefs(buyList)

const onChange = (data) => {
  const { value, label } = data

  unitPrice.value.min = null
  unitPrice.value.max = null

  unitPrice.value.label = value
    ? label
    : onResolveByDevice(unitPrice.value.defaultLabel, device.value)
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
    <li v-for="(item, index) in unitPrice.options" :key="`unitPrice_${item.value}_${index}`">
      <BuyMFormRadio
        name="uniprice"
        v-model="apiSearchData.uniprice"
        :config="{
          label: item.label,
          value: item.value,
        }"
        @change="onChange"
      />
    </li>
    <li>
      <PageBuyListSearchMaxMinRange
        name="unitPrice"
        :data="unitPrice"
        v-model:min="unitPrice.min"
        v-model:max="unitPrice.max"
        :config="{
          placeholder: {
            min: '最低',
            max: '最高',
          },
          schema: {
            api: 'uniprice',
          },
          maxlength: 3,
          suffix: unitPrice.unit,
        }"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
