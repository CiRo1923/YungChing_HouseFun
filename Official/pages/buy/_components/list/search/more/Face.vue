<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const { onResolveByDevice } = useBuyProjectActions()
const buyList = useBuyListStore()
const { apiSearchData, face } = storeToRefs(buyList)

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
      <BuyMFormCheckBox
        name="dt"
        v-model="apiSearchData.dt"
        :config="{
          label: item.text,
          value: item.value,
          valueClickClear: '',
          isJoin: true,
        }"
        :setClass="{
          main: '--icon-size-20',
        }"
        @change="onChange"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
