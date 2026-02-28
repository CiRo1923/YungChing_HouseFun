<script setup>
import Address from '@components/buy/mAddress.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useStores from '@stores/buy/_composables/useStores.js'

const buyProject = useBuyProjectStore()
const { project } = useStores()
const { options, apiData } = storeToRefs(buyProject)

const areas = ref([])
const roads = ref([])

const onCityChange = async () => {
  const { cityID } = apiData.value
  apiData.value.districtID = ''
  apiData.value.road = ''
  areas.value = []
  roads.value = []

  const { status, data } = await project.onApiGETDistrictSelectOptions(cityID)

  if (status === 200) {
    areas.value = data
  }
}

const onAreaChange = async () => {
  const { cityID, districtID } = apiData.value

  apiData.value.road = ''
  roads.value = []

  const { status, data } = await project.onApiGETRoad(cityID, districtID)

  if (status === 200) {
    roads.value = data
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
