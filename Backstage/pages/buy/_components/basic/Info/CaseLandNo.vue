<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)
</script>

<template>
  <FormInput
    name="caseLandNo"
    v-model="apiData.caseLandNo"
    :config="{
      placeholder: '請輸入地號',
    }"
    :rules="{
      required: '請輸入地號',
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8',
    }"
  />
</template>

<style></style>
