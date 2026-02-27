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
  <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
    <li>
      <FormInput
        name="agentPhone"
        v-model="apiData.posterInfo.agentPhone"
        :config="{
          inputMode: 'tel',
          inputChinese: false,
          isDisabled: posterInfoImport === 'same',
        }"
        :rules="{
          required: '請輸入行動電話',
          phone: '行動電話格式錯誤',
        }"
        :setClass="{
          main: '--height-40 --px-12 --py-8 tm:w-[228px] p:w-[270px]',
          element: 'grow',
        }"
      />
    </li>
    <li class="flex h-[40px] items-center">
      <FormCheckBox
        name="isAgentDND"
        v-model="apiData.posterInfo.isAgentDND"
        :config="{
          label: '屋主聲明，請仲介勿擾！',
          value: {
            true: true,
            false: false,
          },
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
