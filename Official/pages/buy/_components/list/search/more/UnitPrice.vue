<script setup>
import { onResolveByDevice } from '@js/_projectPrototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { content, unitPrice } = storeToRefs(buyList)

// const data = computed(() => content.value.data || [])
const apiData = computed(() => content.value.apiData || {})

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
      <CommonMFormRadio
        name="uniprice"
        v-model="apiData.uniprice"
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
