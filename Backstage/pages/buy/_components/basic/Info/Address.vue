<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBasicActions from '@stores/buy/composables/useBasicActions.js'

import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const { onApiGETDistrictSelectOptions, onApiGETRoad } = useBuyProjectActions()
const buyBasic = useBuyBasicStore()
const { apiData, address } = storeToRefs(buyBasic)
const { onAddress } = useBasicActions()

const { onCustom } = useBuyPopupActions()

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

  await onApiGETDistrictSelectOptions(cityID)

  areas.value = options.value.area
}

const onAreaChange = async ({ source } = {}) => {
  const { cityID, districtID } = apiData.value.caseInfo

  if (source !== 'init') {
    apiData.value.caseInfo.road = ''
    roads.value = []
  }

  if (!cityID || !districtID) return

  const { status, data } = await onApiGETRoad(cityID, districtID)

  if (status === 200) {
    roads.value = data
  }
}

const onPopupAddressGoogleMap = async () => {
  const isCustom = await onCustom({
    id: 'popupAddressGoogleMap',
    title: '地圖定位',
    icon: 'icon_map',
    btns: 'confirm',
  })

  if (isCustom) {
    const { city, area, road, lane, alley, number } = isCustom
    const cityID = options.value.city.find((item) => item.text === city)
    const districtID = options.value.area.find((item) => item.text === area)

    apiData.value.caseInfo.cityID = Number(cityID.value)
    apiData.value.caseInfo.districtID = Number(districtID.value)
    apiData.value.caseInfo.road = road
    apiData.value.caseInfo.lane = lane
    apiData.value.caseInfo.alley = alley
    apiData.value.caseInfo.addrNum = number

    address.value = isCustom
    console.log('地圖定位地址:', isCustom)
  }
}
</script>

<template>
  <div class="space-y-[8px]">
    <BuyMAddress
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
        city: 't:w-[180px] p:w-[260px]',
        area: 't:w-[180px] p:w-[260px]',
        road: 't:w-[220px] p:w-[294px]',
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
    <div
      class="flex m:flex-col-reverse m:items-start m:gap-y-[12px] m:text-[16px] t:gap-x-[12px] pt:items-center pt:text-[14px] p:gap-x-[16px]"
    >
      <BuyMAnchor
        text="調整地圖定位"
        :config="{
          icon: {
            position: 'left',
            name: 'icon_location',
          },
        }"
        :setClass="{
          main: '--text-green-6a2d shrink-0 underline',
          text: 'font-normal',
          icon: 'h-[16px] w-[16px] text-[--gray-666]',
        }"
        @click="onPopupAddressGoogleMap"
      />
      <p class="min-w-0 truncate text-[--gray-666] m:w-full">顯示至路段名：{{ onAddress() }}</p>
    </div>
  </div>
</template>

<style></style>
