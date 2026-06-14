<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onResolveByDevice } = useBuyProjectActions()
const buyList = useBuyListStore()
const { apiSearchData, age } = storeToRefs(buyList)

const onChange = (data) => {
  const { value, label } = data

  age.value.min = null
  age.value.max = null

  age.value.label = value ? label : onResolveByDevice(age.value.defaultLabel, device.value)
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
    <li v-for="(item, index) in age.options" :key="`age_${item.value}_${index}`">
      <BuyMFormRadio
        name="age"
        v-model="apiSearchData.age"
        :config="{
          label: item.label,
          value: item.value,
        }"
        @change="onChange"
      />
    </li>
    <li>
      <PageBuyListSearchMaxMinRange
        name="age"
        :data="age"
        v-model:min="age.min"
        v-model:max="age.max"
        :config="{
          placeholder: {
            min: '最低',
            max: '最高',
          },
          suffix: age.unit,
          schema: {
            api: 'age',
          },
        }"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
