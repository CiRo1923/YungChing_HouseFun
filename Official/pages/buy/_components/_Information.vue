<script setup>
import TabSeparator from '@components/buy/mTab/Separator.vue'

import { useHomeStore } from '@stores/buy/home.js'

const emits = defineEmits(['click'])
const home = useHomeStore()
const { info } = storeToRefs(home)

const onClick = (data) => {
  const { item } = data

  info.value.active = item.value

  emits('click')
}
</script>

<template>
  <TabSeparator
    :items="info.items"
    :config="{
      active: 0,
    }"
    :setClass="{
      main: 'p:--gap-x-30 pt:grow',
    }"
    @click="onClick"
  />
</template>

<style></style>
