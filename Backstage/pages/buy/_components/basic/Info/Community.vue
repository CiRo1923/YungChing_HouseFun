<script setup>
import { apiGETCommunities } from '@js/_api/buy/index.js'

import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'
import AutoComplete from '@components/buy/mAutoComplete.vue'

import RadiosOval from '@pages/buy/_containers/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)

const radioOptions = readonly([
  {
    label: '非社區 / 建案',
    value: false,
  },
  {
    label: '所屬社區 / 建案',
    value: true,
  },
])

const onIsCaseCommunityChange = () => {
  apiData.value.caseInfo.caseCommunityName = null
  apiData.value.caseInfo.caseCommunityID = null
}

const onCommunityChange = (item) => {
  const { value } = item || {}

  apiData.value.caseInfo.caseCommunityID = value || null
}
</script>

<template>
  <RadiosOval>
    <FormRadiosOval
      name="isCaseCommunity"
      v-model="apiData.caseInfo.isCaseCommunity"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onIsCaseCommunityChange"
    />
    <AutoComplete
      name="caseCommunityName"
      v-model="apiData.caseInfo.caseCommunityName"
      :config="{
        placeholder: '請選擇社區',
        noMatchClearLabel: true,
        isDisabled: !apiData.caseInfo.isCaseCommunity,
        schema: {
          search: 'keyword',
          data: 'items',
          label: 'text',
          value: 'value',
          model: 'text',
        },
        api: {
          path: apiGETCommunities,

          params: {
            pageSize: 100,
          },
        },
      }"
      :setClass="{
        main: '--h-40 --px-12 --py-8 m:w-full',
      }"
      @change="onCommunityChange"
    />
  </RadiosOval>
</template>

<style></style>
