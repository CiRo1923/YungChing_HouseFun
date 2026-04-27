<script setup>
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBuyBasicActions from '@stores/buy/_composables/useBasicActions.js'

// const buyProject = useBuyProjectStore()
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
const { onPingUnitChange } = useBuyBasicActions()
</script>

<template>
  <BuyMFormRadiosOval
    name="isCaseSqUnitPin"
    v-model="apiData.caseInfo.isCaseSqUnitPin"
    :options="buyBasic.options.unit"
    :setClass="{
      radios: 'm:w-full',
      container: 'm:flex-1',
    }"
    @change="onPingUnitChange"
  />
</template>

<style></style>
