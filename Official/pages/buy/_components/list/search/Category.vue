<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { apiSearchData, tab } = storeToRefs(buyList)

const emits = defineEmits(['click'])

const options = computed(() => {
  return tab.value.options.map((item) => {
    const key =
      Object.keys(item.label).find((k) => k.includes(device.value)) || Object.keys(item.label)[0]

    return {
      ...item,
      label: item.label[key],
    }
  })
})

const onClick = (data) => {
  const { item } = data

  apiSearchData.value.tab = item.value

  emits('click')
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
  <BuyMTabSeparator
    :items="options"
    :config="{
      active: apiSearchData.tab,
    }"
    :setClass="{
      main: 'p:--gap-x-30 m:--gap-x-5 pt:--line pt:grow',
    }"
    @click="onClick"
  />
</template>

<style></style>
