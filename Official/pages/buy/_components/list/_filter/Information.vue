<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/_composables/useProjectActions.js'

const project = useBuyProjectStore()
const { device } = storeToRefs(project)
const buyList = useBuyListStore()
const { tab } = storeToRefs(buyList)
const { onResize } = useBuyProjectActions()
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

  tab.value.apiData = item.value

  emits('click')
}

onBeforeUnmount(() => {
  onResize('remove')
})

onMounted(() => {
  onResize('add')
})
</script>

<template>
  <BuyMTabSeparator
    :items="options"
    :config="{
      active: tab.apiData,
    }"
    :setClass="{
      main: 'p:--gap-x-30 m:--gap-x-5 pt:--line pt:grow',
    }"
    @click="onClick"
  />
</template>

<style></style>
