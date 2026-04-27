<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
</script>

<template>
  <ul class="flex flex-wrap m:gap-[12px] pt:gap-[8px]">
    <li v-for="(item, index) in options.feature" :key="`${item.code}_${index}`">
      <BuyMTagCheckBox
        :name="`caseFeatureToken[${index}]`"
        v-model="apiData.caseInfo.caseFeatureToken"
        :config="{
          label: item.text,
          value: item.code,
          assist: '#',
          isJoin: true,
        }"
        :setClass="{
          main: 'pt:--h-30 m:--h-35 --px-15 --py-5',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
