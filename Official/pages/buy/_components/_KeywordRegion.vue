<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useHomeStore } from '@stores/buy/home.js'

const home = useHomeStore()
const { keyword } = storeToRefs(home)
</script>

<template>
  <FormInput
    name="keyword"
    v-model="keyword"
    :config="{
      placeholder: '請輸入關鍵字或房屋編號',
    }"
    :setClass="{
      main: 'p:--h-45 p:--px-12 p:--py-5 p:w-[300px]',
    }"
  />
</template>

<style></style>
