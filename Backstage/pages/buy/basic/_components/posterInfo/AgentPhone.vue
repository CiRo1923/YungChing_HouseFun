<script setup>
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
</script>

<template>
  <ul class="m:space-y-[12px] t:gap-x-[16px] pt:flex p:gap-x-[24px]">
    <li class="t:w-[220px] p:w-[270px]">
      <BuyMFormInput
        name="agentPhone"
        v-model="apiData.caseInfo.posterInfo.agentPhone"
        :config="{
          inputMode: 'tel',
          inputChinese: false,
          isDisabled: apiData.caseInfo.posterDataSourceToken === 1,
        }"
        :rules="{
          required: '請輸入行動電話',
          phone: '行動電話格式錯誤',
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
          element: 'grow',
        }"
      />
    </li>
    <li class="flex items-center pt:h-[40px]">
      <BuyMFormCheckBox
        name="isAgentDND"
        v-model="apiData.caseInfo.posterInfo.isAgentDND"
        :config="{
          mode: 'boolean',
          label: '屋主聲明，請仲介勿擾！',
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
