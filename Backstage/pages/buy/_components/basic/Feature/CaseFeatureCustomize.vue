<script setup>
import { useBuyBasicStore } from '@stores/buy/basic.js'
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
const caseFeatureCustomize = ref([])
</script>

<template>
  <div class="border-t-[1px] border-dashed border-t-[--gray-e5] m:pt-[40px] pt:pt-[24px]">
    <BuyMTagCustomGroup
      name="caseFeatureCustomize"
      v-model="caseFeatureCustomize"
      :config="{
        placeholder: '自定特色標籤',
        minWidth: 86,
      }"
      :setClass="{
        tag: {
          main: 'pt:--h-30 m:--h-35 --px-15 --py-5',
        },
      }"
    />
  </div>
</template>

<style></style>
