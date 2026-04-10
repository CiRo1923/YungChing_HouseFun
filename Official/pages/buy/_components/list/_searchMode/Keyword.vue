<script setup>
import { useBuyListStore } from '@stores/buy/list.js'

const buyList = useBuyListStore()
const { keyword } = storeToRefs(buyList)
</script>

<template>
  <BuyMFormInput
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
