<script setup>
// const buyProject = useBuyProjectStore()
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
const { onPingUnitChange } = useBuyPublishActions()
</script>

<template>
  <CommonMFormRadiosOval
    name="isCaseSqUnitPin"
    v-model="apiData.caseInfo.isCaseSqUnitPin"
    :options="buyPublish.options.unit"
    :setClass="{
      label: 'text-[16px]',
      radios: 'm:w-full',
      container: 'm:flex-1',
    }"
    @change="onPingUnitChange"
  />
</template>
