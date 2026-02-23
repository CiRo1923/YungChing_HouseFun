<script setup>
import FormSelect from '@components/buy/mForm/Select.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
</script>

<template>
  <FormSelect
    name="caseTypeToken"
    v-model="apiData.caseTypeToken"
    :options="options.caseType"
    :config="{
      placeholder: '請選擇型態',
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :rules="{
      required: '請選擇型態',
    }"
    :setClass="{
      main: '--height-40 --px-12 --py-8 grow',
    }"
  />
</template>

<style></style>
