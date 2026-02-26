<script setup>
import FormSelect from '@components/buy/mForm/Select.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
</script>

<template>
  <FormSelect
    name="caseStructureToken"
    v-model="apiData.caseStructureToken"
    :options="options.structure"
    :config="{
      placeholder: {
        value: '請選擇建物結構',
        isToOption: true,
      },
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :setClass="{
      main: '--height-40 --px-12 --py-8 grow',
    }"
  />
</template>

<style></style>
