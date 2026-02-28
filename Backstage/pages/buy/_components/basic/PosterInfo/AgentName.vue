<script setup>
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyProject)
const { posterInfoImport } = storeToRefs(buyBasic)
</script>

<template>
  <ul class="flex overflow-hidden tm:gap-x-[16px] p:gap-x-[24px]">
    <li class="m:min-w-0 m:grow t:w-[220px] p:w-[270px]">
      <FormInput
        name="agentName"
        v-model="apiData.posterInfo.agentName"
        :config="{
          isDisabled: posterInfoImport === 'same',
        }"
        :rules="{
          required: '請輸入姓名',
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
          element: 'grow',
        }"
      />
    </li>
    <li class="flex h-[40px] items-center m:shrink-0">
      <FormCheckBox
        name="isShowNickname"
        v-model="apiData.posterInfo.isShowNickname"
        :config="{
          mode: 'boolean',
          label: '同時顯示暱稱',
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
