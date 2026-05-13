<script setup>
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyPublishStore } from '@stores/buy/publish.js'
import useBuyPublishActions from '@stores/buy/composables/usePublishActions.js'

// const buyProject = useBuyProjectStore()
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
const { onPingUnitChange } = useBuyPublishActions()
</script>

<template>
  <BuyMFormRadiosOval
    name="isCaseSqUnitPin"
    v-model="apiData.caseInfo.isCaseSqUnitPin"
    :options="buyPublish.options.unit"
    :setClass="{
      radios: 'm:w-full',
      container: 'm:flex-1',
    }"
    @change="onPingUnitChange"
  />
</template>

<style></style>
