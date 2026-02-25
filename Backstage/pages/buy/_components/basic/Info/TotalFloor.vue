<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)
</script>

<template>
  <FormInput
    name="caseFloorTotal"
    v-model="apiData.caseFloorTotal"
    :config="{
      isExistClose: false,
    }"
    :rules="{
      required: '請輸入總樓高',
    }"
    :setClass="{
      main: '--height-40 --px-12 --py-8 p:w-[100px]',
      element: 'grow',
      rearAssist: 'text-[14px] text-[--gray-999]',
    }"
  >
    <template #rearAssist>樓</template>
  </FormInput>
</template>

<style></style>
