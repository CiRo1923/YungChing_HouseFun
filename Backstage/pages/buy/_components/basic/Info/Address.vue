<script setup>
import Address from '@components/buy/mAddress.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)

const areas = ref(null)

const onCityChange = async () => {
  const { status, data } = await buyProject.onApiGETDistrictSelectOptions(apiData.value.cityID)

  if (status === 200) {
    areas.value = data
  }
}
</script>

<template>
  <Address
    name="info"
    v-model:city="apiData.cityID"
    v-model:area="apiData.districtID"
    v-model:road="apiData.road"
    v-model:lane="apiData.lane"
    v-model:alley="apiData.alley"
    v-model:number="apiData.addrNum"
    v-model:ofNumber="apiData.addrNumOf"
    v-model:floor="apiData.floor"
    v-model:ofFloor="apiData.addrNumOfFloor"
    :config="{
      options: {
        city: options.city,
        area: areas,
      },
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :setClass="{
      main: 'grow',
      city: 'pt:w-[260px]',
      area: 'pt:w-[260px]',
      road: 'pt:w-[263px]',
      lane: 'm:w-[98px] pt:w-[86px]',
      alley: 'm:w-[98px] pt:w-[86px]',
      number: 'm:w-[98px] pt:w-[86px]',
      ofNumber: 'm:w-[74px] pt:w-[45px]',
      floor: 'm:w-[98px] pt:w-[86px]',
      ofFloor: 'm:w-[74px] pt:w-[45px]',
    }"
    @change:city="onCityChange"
  />
</template>

<style></style>
