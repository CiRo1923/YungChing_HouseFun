<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData, options } = storeToRefs(buyProject)
</script>

<template>
  <FormRadiosOval
    name="posterDataSourceToken"
    v-model="apiData.posterDataSourceToken"
    :options="options.posterDataSource"
    :config="{
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :setClass="{
      radios: 'm:w-full',
      container: 'm:flex-1',
    }"
  />
</template>

<style></style>
