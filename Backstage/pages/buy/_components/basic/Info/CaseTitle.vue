<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)
</script>

<template>
  <FormInput
    name="caseTitle"
    v-model="apiData.caseTitle"
    :config="{
      placeholder: '請輸入物件標題',
      maxlength: 25,
      formatLength: '{length} / {maxlength}',
    }"
    :rules="{
      required: '請輸入物件標題',
    }"
    :setClass="{
      main: '--height-40 --px-12 --py-8 grow',
      element: 'grow',
      length: 'text-[14px] text-[--gray-999]',
      suffix: 'block text-[14px] text-[--gray-999] tm:mt-[8px] p:mt-[4px]',
    }"
  >
    <template #suffix="{ maxlength, length }">
      <p class="before:content-[attr(data-label)]" data-label="•">
        還差
        <span class="text-[--orange-e646]">{{ maxlength - length }}</span> 個字符合優質排序
      </p>
    </template>
  </FormInput>
</template>

<style></style>
