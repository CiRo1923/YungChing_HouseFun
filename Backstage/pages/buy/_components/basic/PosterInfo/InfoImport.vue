<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'

import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyBasic = useBuyBasicStore()
const { posterInfoImport } = storeToRefs(buyBasic)
</script>

<template>
  <FormRadiosOval
    name="import"
    v-model="posterInfoImport"
    :options="buyBasic.posterInfoOptions"
    :setClass="{
      main: 'grow',
    }"
  />
</template>

<style></style>
