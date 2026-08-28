<script setup>
import { onResolveByDevice } from '@js/_projectPrototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { content, age } = storeToRefs(buyList)

// const data = computed(() => content.value.data || [])
const apiData = computed(() => content.value.apiData || {})

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
      <CommonMFormRadio
        name="age"
        v-model="apiData.age"
        :config="{
          label: item.label,
          value: item.value,
        }"
        :setClass="{
          element: 'p:text-[16px]',
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
