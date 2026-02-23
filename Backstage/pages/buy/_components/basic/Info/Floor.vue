<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
const floorOPtion = readonly([
  {
    label: '單層',
    value: true,
  },
  {
    label: '多層',
    value: false,
  },
])
</script>

<template>
  <div class="grow m:space-y-[12px] pt:space-y-[8px]">
    <FormRadiosOval
      name="isSingleFloor"
      v-model="apiData.isSingleFloor"
      :options="floorOPtion"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
    />
    <ul class="pt:flex">
      <li></li>
    </ul>
  </div>
</template>

<style></style>
