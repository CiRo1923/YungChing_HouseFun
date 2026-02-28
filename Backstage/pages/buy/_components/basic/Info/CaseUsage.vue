<script setup>
import FormSelect from '@components/buy/mForm/Select.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
</script>

<template>
  <FormSelect
    name="caseUsageToken"
    v-model="apiData.caseUsageToken"
    :options="options.caseUsage"
    :config="{
      placeholder: '請選擇法定用途',
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :rules="{
      required: '請選擇法定用途',
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8',
    }"
  />
</template>

<style></style>
