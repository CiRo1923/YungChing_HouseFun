<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
</script>

<template>
  <FormRadiosOval
    name="casePurposeToken"
    v-model="apiData.casePurposeToken"
    :options="options.casePurpose"
    :config="{
      schema: {
        label: 'text',
        value: 'code',
      },
    }"
    :rules="{
      required: '請選擇現況',
    }"
  />
</template>

<style></style>
