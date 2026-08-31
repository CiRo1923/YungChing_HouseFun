<script setup>
import { onResolveByDevice } from '@js/_projectPrototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const manage = useManageStore()
const { options } = storeToRefs(manage)
const buyList = useBuyListStore()
const { content, nearBy } = storeToRefs(buyList)

// const data = computed(() => content.value.data || [])
const apiData = computed(() => content.value.apiData || {})

const onChange = (data) => {
  const { value, label } = data

  nearBy.value.label = value ? label : onResolveByDevice(nearBy.value.defaultLabel, device.value)
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
    <li v-for="(item, index) in options.nearBy" :key="`nearBy_${item.code ?? item.value}_${index}`">
      <CommonMFormCheckBox
        name="ft"
        v-model="apiData.ft"
        :config="{
          label: item.text,
          value: item.code ?? item.value,
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
