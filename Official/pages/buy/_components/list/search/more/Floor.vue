<script setup>
import { onResolveByDevice } from '@js/_projectPrototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { content, floor } = storeToRefs(buyList)

// const data = computed(() => content.value.data || [])
const apiData = computed(() => content.value.apiData || {})

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
      <CommonMFormRadio
        name="age"
        v-model="apiData.floor"
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
