<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'
import useStores from '@stores/buy/_composables/useStores.js'

const buyProject = useBuyProjectStore()
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyProject)
const { basic } = useStores()
</script>

<template>
  <FormRadiosOval
    name="isCaseSqUnitPin"
    v-model="apiData.isCaseSqUnitPin"
    :options="buyBasic.options.unit"
    :setClass="{
      radios: 'm:w-full',
      container: 'm:flex-1',
    }"
    @change="basic.onPingUnitChange"
  />
</template>

<style></style>
