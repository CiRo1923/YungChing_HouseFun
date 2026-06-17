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
  <BuyMTabBorderBottom
    :items="options"
    :config="{
      active: apiSearchData.tab,
      containerMode: multiple,
    }"
    :setClass="{
      main: '--green-8b0d pt:--has-border-b p:--anchor-px-20 p:--anchor-py-10 tm:--anchor-px-15 tm:--anchor-py-5 pt:grow',
      header: 'flex items-center',
      anchor: 'tm:text-[14px] p:text-[16px]',
    }"
    @click="onClick"
  >
    <template #headerTools>
      <slot name="headerTools" />
    </template>
  </BuyMTabBorderBottom>
</template>

<style></style>
