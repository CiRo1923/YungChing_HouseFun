<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
</script>

<template>
  <ul class="m:space-y-[12px] pt:flex pt:gap-x-[8px]">
    <li class="pt:w-[160px] pt:shrink-0">
      <BuyMFormSelect
        name="caseVideoTypeToken"
        v-model.number="apiData.caseInfo.caseVideoTypeToken"
        :options="options.videoType"
        :config="{
          placeholder: {
            value: '請選擇影音類型',
            isToOption: true,
          },
          schema: {
            label: 'text',
            value: 'value',
          },
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
        }"
      />
    </li>
    <li class="pt:grow">
      <BuyMFormInput
        name="caseVideoUrl"
        v-model="apiData.caseInfo.caseVideoUrl"
        :config="{
          placeholder: '請輸入影音來源',
        }"
        :rules="{
          required: {
            valid: apiData.caseInfo.caseVideoTypeToken,
            errorMessage: '請輸入影音來源',
          },
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
          element: 'grow',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
