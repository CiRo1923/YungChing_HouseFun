<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'
import FormSelect from '@components/buy/mForm/Select.vue'

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
      <li>
        <FormSelect
          name="floorFromToken"
          v-model="apiData.floorFromToken"
          :options="options.floor"
          :config="{
            placeholder: '請選擇',
            schema: {
              label: 'text',
              value: 'value',
            },
          }"
          :rules="{
            required: '請選擇法定用途',
          }"
          :setClass="{
            main: '--height-40 --px-12 --py-8 grow',
          }"
        />
      </li>
    </ul>
  </div>
</template>

<style></style>
