<script setup>
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
