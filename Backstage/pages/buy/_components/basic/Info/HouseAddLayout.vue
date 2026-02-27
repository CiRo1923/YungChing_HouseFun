<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)
</script>

<template>
  <ul class="flex flex-wrap gap-x-[8px] gap-y-[12px]">
    <li>
      <FormInput
        name="caseAddRoom"
        v-model="apiData.caseAddRoom"
        :config="{
          isExistClose: false,
          maxlength: 2,
          isDisabled: !apiData.isCaseAddtion,
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>房</template>
      </FormInput>
    </li>
    <li>
      <FormInput
        name="caseAddLivingRoom"
        v-model="apiData.caseAddLivingRoom"
        :config="{
          isExistClose: false,
          maxlength: 2,
          isDisabled: !apiData.isCaseAddtion,
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>廳</template>
      </FormInput>
    </li>
    <li>
      <FormInput
        name="caseAddBathroom"
        v-model="apiData.caseAddBathroom"
        :config="{
          isExistClose: false,
          maxlength: 2,
          isDisabled: !apiData.isCaseAddtion,
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8 tm:w-[151px] p:w-[100px]',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>衛</template>
      </FormInput>
    </li>
    <li>
      <FormInput
        name="caseAddBalcony"
        v-model="apiData.caseAddBalcony"
        :config="{
          isExistClose: false,
          maxlength: 2,
          isDisabled: !apiData.isCaseAddtion,
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8 tm:w-[151px] p:w-[110px]',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>陽台</template>
      </FormInput>
    </li>
  </ul>
</template>

<style></style>
