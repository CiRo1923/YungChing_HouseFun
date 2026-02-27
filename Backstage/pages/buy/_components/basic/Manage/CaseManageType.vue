<script setup>
import FormSelect from '@components/buy/mForm/Select.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
</script>

<template>
  <FormSelect
    name="caseManageTypeToken"
    v-model="apiData.caseManageTypeToken"
    :options="options.manageType"
    :config="{
      placeholder: {
        value: '請選擇管理方式',
        isToOption: true,
      },
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 p:w-[270px]',
    }"
  />
</template>

<style></style>
