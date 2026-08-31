<script setup>
import { onNormalizeAddressText } from '@js/_projectPrototype.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const { onApiGETDistrictSelectOptions, onApiGETRoad } = useBuyProjectActions()
const buyPublish = useBuyPublishStore()
const { apiData, address, statusData } = storeToRefs(buyPublish)
const { onAddress } = useBuyPublishActions()

const { onCustom } = usePopupActions()

const areas = ref(options.value.area || [])
const roads = ref([])

const casePurposeToken = computed(() => apiData.value.caseInfo.casePurposeToken)
// 1:刊登中 / 2:草稿 / 3:已成交 / 4:已下架 / 6:草稿(待刊登)
const isAddressLocked = computed(() => [1, 4].includes(statusData.value?.caseStatus))
const rules = computed(() => {
  const { cityID, districtID, road, addrNum } = apiData.value.caseInfo

  return !!(cityID && districtID && road && (casePurposeToken.value !== '8' ? addrNum : true))
})

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
  const { isSure: isCustom } = await onCustom({
    id: 'popupAddressGoogleMap',
    title: '地圖定位',
    icon: 'icon_map',
    btns: 'confirm',
  })

  if (isCustom) {
    const { city, area, road, lane, alley, number } = address.value
    const { caseInfo } = apiData.value

    // Google 回官方寫法(臺北市),後端選項用台北市 —— 兩邊都正規化過再比,否則對不上、
    // cityID 會被設成 null,地址就整個存不進去
    const cityText = onNormalizeAddressText(city)
    const areaText = onNormalizeAddressText(area)
    const cityOption = options.value.city.find(
      (item) => onNormalizeAddressText(item.text) === cityText
    )
    const districtOption = options.value.area.find(
      (item) => onNormalizeAddressText(item.text) === areaText
    )
    const [addrNum, addrNumOf = null] = String(number || '').split(/-|之/)

    caseInfo.cityID = cityOption ? Number(cityOption.value) : null
    caseInfo.districtID = districtOption ? Number(districtOption.value) : null
    caseInfo.road = road || null

    if (casePurposeToken.value !== '8') {
      Object.assign(caseInfo, {
        lane: lane || null,
        alley: alley || null,
        addrNum: addrNum || null,
        addrNumOf,
      })
    }
  }

  // 不論確認或取消都清掉:地圖回傳只是「填入表單」的一次性資料,留著會變成過期的顯示來源,
  // 也會影響下一次開啟定位
  address.value = null
}
</script>

<template>
  <CommonMFormHidden
    name="address"
    v-model="rules"
    :rules="{
      custom: {
        valid: rules,
        errorMessage: '請填寫完整的地址',
      },
    }"
    :setClass="{
      error: 'mt-[4px]',
    }"
    v-slot="{ isError }"
  >
    <!-- 1: 住宅 2: 店面 3: 住店 4: 辦公 5: 住辦 6: 廠房 7: 車位 8: 土地 9: 其他 -->
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
          isError,
          isDisabled: isAddressLocked,
          schema: {
            label: 'text',
            value: 'value',
          },
        },
        area: {
          options: areas,
          isError,
          isDisabled: isAddressLocked,
          schema: {
            label: 'text',
            value: 'value',
          },
        },
        road: {
          options: roads,
          isError,
          isDisabled: isAddressLocked,
          schema: {
            label: 'roadName',
            value: 'roadID',
            model: 'roadName',
          },
        },
        lane: {
          isDisabled: isAddressLocked,
        },
        alley: {
          isDisabled: isAddressLocked,
        },
        number: {
          isError,
          isDisabled: isAddressLocked,
        },
        ofNumber: {
          isDisabled: isAddressLocked,
        },
        floor: {
          isDisabled: isAddressLocked,
        },
        ofFloor: {
          isDisabled: isAddressLocked,
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
      v-if="casePurposeToken !== '8'"
    />
    <BuyMAddress
      name="info"
      v-model:city.number="apiData.caseInfo.cityID"
      v-model:area.number="apiData.caseInfo.districtID"
      v-model:road="apiData.caseInfo.road"
      :config="{
        city: {
          options: options.city,
          isError,
          isDisabled: isAddressLocked,
          schema: {
            label: 'text',
            value: 'value',
          },
        },
        area: {
          options: areas,
          isError,
          isDisabled: isAddressLocked,
          schema: {
            label: 'text',
            value: 'value',
          },
        },
        road: {
          options: roads,
          isError,
          isDisabled: isAddressLocked,
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
      }"
      @change:city="onCityChange"
      @change:area="onAreaChange"
      v-if="casePurposeToken === '8'"
    />
  </CommonMFormHidden>
  <div
    class="mt-[8px] flex m:flex-col-reverse m:items-start m:gap-y-[12px] m:text-[16px] t:gap-x-[12px] pt:items-center pt:text-[14px] p:gap-x-[16px]"
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
        icon: 'h-[16px] w-[16px] text-[--gray-666]',
      }"
      @click="onPopupAddressGoogleMap"
    />
    <p class="line-clamp-1 min-w-0 text-[--gray-666] m:w-full">顯示至路段名：{{ onAddress() }}</p>
  </div>
</template>
