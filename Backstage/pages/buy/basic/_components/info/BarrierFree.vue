<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
</script>

<template>
  <ul class="m:space-y-[16px] pt:flex pt:flex-wrap pt:gap-x-[24px] pt:gap-y-[16px]">
    <li v-for="(item, index) in options.barrierFree" :key="`${item.code}_${index}`">
      <BuyMFormCheckBox
        :name="`caseBarrierfreeToken[${index}]`"
        v-model="apiData.caseInfo.caseBarrierfreeToken"
        :config="{
          label: item.text,
          value: item.code,
          isJoin: true,
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
