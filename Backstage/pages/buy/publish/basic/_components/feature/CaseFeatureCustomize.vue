<script setup>
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <BuyMTagCustomGroup
    name="caseFeatureCustomize"
    v-model="apiData.caseInfo.caseFeatureCustomize"
    :config="{
      placeholder: '自定特色標籤',
      minWidth: 86,
      isJoin: true,
    }"
    :setClass="{
      tag: {
        main: 'pt:--h-30 m:--h-35 --px-15 --py-5 hover:--bg-green-8b0d hover:--text-white hover:--border-transparent tm:text-[16px] p:text-[14px]',
      },
    }"
  />
</template>
