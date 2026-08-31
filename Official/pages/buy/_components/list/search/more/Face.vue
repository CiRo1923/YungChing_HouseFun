<script setup>
import { onResolveByDevice } from '@js/_projectPrototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const manage = useManageStore()
const { options } = storeToRefs(manage)
const buyList = useBuyListStore()
const { content, face } = storeToRefs(buyList)

// const data = computed(() => content.value.data || [])
const apiData = computed(() => content.value.apiData || {})

const onChange = (data) => {
  const { value, label } = data

  face.value.label = value ? label : onResolveByDevice(face.value.defaultLabel, device.value)
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
    <li v-for="(item, index) in options.face" :key="`face_${item.value}_${index}`">
      <CommonMFormCheckBox
        name="dt"
        v-model="apiData.dt"
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
