<script setup>
import FormSelect from '@components/buy/mForm/Select.vue'
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
</script>

<template>
  <ul class="m:space-y-[12px] pt:flex pt:gap-x-[8px]">
    <li class="pt:w-[160px] pt:shrink-0">
      <FormSelect
        name="caseVideoTypeToken"
        v-model="apiData.caseVideoTypeToken"
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
      <FormInput
        name="caseVideoUrl"
        v-model="apiData.caseVideoUrl"
        :config="{
          placeholder: '請輸入影音來源',
        }"
        :rules="{
          required: {
            valid: apiData.caseVideoTypeToken,
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
