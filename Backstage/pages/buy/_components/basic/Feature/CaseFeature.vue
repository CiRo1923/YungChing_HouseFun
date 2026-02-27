<script setup>
import TagCheckBox from '@components/buy/mTag/CheckBox.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
</script>

<template>
  <ul class="flex flex-wrap m:gap-[12px] pt:gap-[8px]">
    <li v-for="(item, index) in options.feature" :key="`${item.code}_${index}`">
      <TagCheckBox
        :name="`caseFeatureToken[${index}]`"
        v-model="apiData.caseFeatureToken"
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
