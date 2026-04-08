<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useListStore } from '@stores/buy/list.js'

const list = useListStore()
const { keyword } = storeToRefs(list)
</script>

<template>
  <FormInput
    name="keyword"
    v-model="keyword"
    :config="{
      placeholder: '請輸入關鍵字或房屋編號',
    }"
    :setClass="{
      main: 'p:--px-12 m:--h-50 tm:--px-10 pt:--h-45 pt:--border pt:--rounded --py-5 grow',
    }"
  />
</template>

<style></style>
