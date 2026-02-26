<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'

import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyBasic = useBuyBasicStore()
const { pingUnit } = storeToRefs(buyBasic)
</script>

<template>
  <FormRadiosOval
    name="pingUnit"
    v-model="pingUnit"
    :options="buyBasic.options.unit"
    :setClass="{
      radios: 'm:w-full',
      container: 'm:flex-1',
    }"
    @change="buyBasic.onPingUnitChange"
  />
</template>

<style></style>
