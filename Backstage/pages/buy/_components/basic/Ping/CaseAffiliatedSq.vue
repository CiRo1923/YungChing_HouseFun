<script setup>
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyProject)
const { pingData, pingUnitLabel } = storeToRefs(buyBasic)
</script>

<template>
  <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
    <li>
      <FormInput
        name="caseAffiliatedSq"
        v-model="pingData.caseAffiliatedSq"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
        }"
        :setClass="{
          main: '--height-40 --px-12 --py-8 p:w-[270px]',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>{{ pingUnitLabel }}</template>
      </FormInput>
    </li>
  </ul>
</template>

<style></style>
