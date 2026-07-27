<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onResolveByDevice } = useBuyProjectActions()
const manage = useManageStore()
const { options } = storeToRefs(manage)
const buyList = useBuyListStore()
const { apiSearchData, nearBy } = storeToRefs(buyList)

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
        v-model="apiSearchData.ft"
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

<style lang="postcss"></style>
