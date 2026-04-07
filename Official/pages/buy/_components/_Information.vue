<script setup>
import TabSeparator from '@components/buy/mTab/Separator.vue'

import { onDevice } from '@js/_prototype.js'

import { useHomeStore } from '@stores/buy/home.js'

const emits = defineEmits(['click'])
const home = useHomeStore()
const { info } = storeToRefs(home)
const device = ref('p')
const items = computed(() => {
  return info.value.items.map((item) => {
    const key =
      Object.keys(item.label).find((k) => k.includes(device.value)) || Object.keys(item.label)[0]

    return {
      id: item.id,
      label: item.label[key],
      value: item.value,
    }
  })
})

const onClick = (data) => {
  const { item } = data

  info.value.active = item.value

  emits('click')
}

const onResize = () => {
  device.value = onDevice()
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <TabSeparator
    :items="items"
    :config="{
      active: 0,
    }"
    :setClass="{
      main: 'p:--gap-x-30 m:--gap-x-5 pt:--line pt:grow',
    }"
    @click="onClick"
  />
</template>

<style></style>
