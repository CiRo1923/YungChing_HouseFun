<script setup>
import Address from '@components/buy/mAddress.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useBuyProjectActions from '@stores/buy/_composables/useProjectActions.js'

const buyProject = useBuyProjectStore()
const { project } = useBuyProjectActions()
const { options, apiData } = storeToRefs(buyProject)

const areas = ref([])
const roads = ref([])

const onCityChange = async ({ source } = {}) => {
  const { cityID } = apiData.value.caseInfo

  if (source !== 'init') {
    apiData.value.caseInfo.districtID = ''
    apiData.value.caseInfo.road = ''
    areas.value = []
    roads.value = []
  }

  if (!cityID) return

  const { status, data } = await project.onApiGETDistrictSelectOptions(cityID)

  if (status === 200) {
    areas.value = data
  }
}

const onAreaChange = async ({ source } = {}) => {
  const { cityID, districtID } = apiData.value.caseInfo

  if (source !== 'init') {
    apiData.value.caseInfo.road = ''
    roads.value = []
  }

  if (!cityID || !districtID) return

  const { status, data } = await project.onApiGETRoad(cityID, districtID)

  if (status === 200) {
    roads.value = data
  }
}
</script>

<template>
  <Address
    name="info"
    v-model:city.number="apiData.caseInfo.cityID"
    v-model:area.number="apiData.caseInfo.districtID"
    v-model:road="apiData.caseInfo.road"
    v-model:lane.number="apiData.caseInfo.lane"
    v-model:alley.number="apiData.caseInfo.alley"
    v-model:number.number="apiData.caseInfo.addrNum"
    v-model:ofNumber.number="apiData.caseInfo.addrNumOf"
    v-model:floor.number="apiData.caseInfo.floor"
    v-model:ofFloor.number="apiData.caseInfo.addrNumOfFloor"
    :config="{
      city: {
        options: options.city,
        schema: {
          label: 'text',
          value: 'value',
        },
      },
      area: {
        options: areas,
        schema: {
          label: 'text',
          value: 'value',
        },
      },
      road: {
        options: roads,
        schema: {
          label: 'roadName',
          value: 'roadID',
          model: 'roadName',
        },
      },
    }"
    :setClass="{
      city: 'pt:w-[260px]',
      area: 'pt:w-[260px]',
      road: 'pt:w-[262px]',
      lane: 'm:w-[98px] pt:w-[86px]',
      alley: 'm:w-[98px] pt:w-[86px]',
      number: 'm:w-[98px] pt:w-[86px]',
      ofNumber: 'm:w-[74px] pt:w-[45px]',
      floor: 'm:w-[98px] pt:w-[86px]',
      ofFloor: 'm:w-[74px] pt:w-[45px]',
    }"
    @change:city="onCityChange"
    @change:area="onAreaChange"
  />
</template>

<style></style>
