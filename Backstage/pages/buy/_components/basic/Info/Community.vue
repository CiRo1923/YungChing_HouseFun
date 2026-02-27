<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'

import RadiosOval from '@pages/buy/_containers/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)

const radioOptions = readonly([
  {
    label: '非社區 / 建案',
    value: false,
  },
  {
    label: '所屬社區 / 建案',
    value: true,
  },
])
</script>

<template>
  <RadiosOval>
    <FormRadiosOval
      name="isCaseCommunity"
      v-model="apiData.isCaseCommunity"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
    />
  </RadiosOval>
</template>

<style></style>
