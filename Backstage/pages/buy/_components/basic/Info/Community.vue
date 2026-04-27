<script setup>
// import { apiGETCommunities } from '@js/_api/buy/index.js'

import RadiosOval from '@pages/buy/_containers/RadiosOval.vue'

// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBuyProjectActions from '@stores/buy/_composables/useProjectActions.js'

// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const { onApiGETCommunities } = useBuyProjectActions()
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)

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
const onCommunities = async (keyword, setOptions) => {
  const { status, data } = await onApiGETCommunities({
    cityID: apiData.value.caseInfo.cityID,
    districtID: apiData.value.caseInfo.districtID,
    road: apiData.value.caseInfo.road,
    lane: apiData.value.caseInfo.lane,
    alley: apiData.value.caseInfo.alley,
    addrNum: apiData.value.caseInfo.addrNum,
    addrNumOf: apiData.value.caseInfo.addrNumOf,
    keyword,
    pageSize: 100,
  })

  if (status === 200) {
    const { items } = data
    setOptions(items)
  }
}

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
    <BuyMFormRadiosOval
      name="isCaseCommunity"
      v-model="apiData.caseInfo.isCaseCommunity"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onIsCaseCommunityChange"
    />
    <BuyMAutoComplete
      name="caseCommunityName"
      v-model="apiData.caseInfo.caseCommunityName"
      :config="{
        placeholder: '請選擇社區',
        noMatchClearLabel: true,
        isDisabled: !apiData.caseInfo.isCaseCommunity,
        input: {
          wait: 500,
          minChars: 1,
        },
        schema: {
          label: 'text',
          value: 'value',
          model: 'text',
        },
      }"
      :setClass="{
        main: '--h-40 --px-12 --py-8 m:w-full',
      }"
      @input="onCommunities"
      @change="onCommunityChange"
    />
  </RadiosOval>
</template>

<style></style>
