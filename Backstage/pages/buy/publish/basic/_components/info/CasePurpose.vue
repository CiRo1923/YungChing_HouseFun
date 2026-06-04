<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

const emits = defineEmits(['change'])

// 1: 住宅 2: 店面 3: 住店 4: 辦公 5: 住辦 6: 廠房 7: 車位 8: 土地 9: 其他
const onChange = async (item) => {
  const { code } = item
  // const value = Number(code)

  apiData.value.caseInfo.caseTypeToken = null // 型態
  apiData.value.caseInfo.caseUsageToken = null // 法定用途

  // 特色描述
  apiData.value.caseInfo.caseFeatureToken = null // 特色標籤

  if (/^(6|8)$/.test(code)) {
    // 社區
    apiData.value.caseInfo.isCaseCommunity = false // 社區類型
    apiData.value.caseInfo.caseCommunityName = null // 所屬社區 / 建案
  }

  if (/^(7|8)$/.test(code)) {
    // 屋齡
    apiData.value.caseInfo.caseAgeIdentifyToken = 1 // 屋齡類型
    apiData.value.caseInfo.caseAge = null // 屋齡
    apiData.value.caseInfo.caseCompletedYear = null // 完工年份
    apiData.value.caseInfo.caseCompletedMonth = null // 完工月份
    apiData.value.caseInfo.isCaseUnknownAge = false // 屋齡不詳
    apiData.value.caseInfo.isCasePreSale = false // 預售屋

    // 格局
    apiData.value.caseInfo.caseRoom = null // 房
    apiData.value.caseInfo.caseLivingRoom = null // 廳
    apiData.value.caseInfo.caseBathroom = null // 衛
    apiData.value.caseInfo.caseBalcony = null // 陽台
    apiData.value.caseInfo.isCaseOpenConcept = false // 開放式格局
    apiData.value.caseInfo.isCaseAddtion = false // 加蓋

    // 加蓋格局
    apiData.value.caseInfo.caseAddRoom = null // 房
    apiData.value.caseInfo.caseAddLivingRoom = null // 廳
    apiData.value.caseInfo.caseAddBathroom = null // 衛
    apiData.value.caseInfo.caseAddBalcony = null // 陽台

    // 朝向
    apiData.value.caseInfo.caseFaceToken = null // 朝向

    // 價格資訊
    apiData.value.caseInfo.isCasePriceIncludeParking = false // 含車位

    // 坪數資訊
    apiData.value.caseInfo.caseAffiliatedSqPin = null // 附屬建物
    apiData.value.caseInfo.caseAffiliatedSqM = null // 附屬建物
    apiData.value.caseInfo.isCaseAttachedSqAutoCalculate = false // 自動加總
    apiData.value.caseInfo.caseParkingSqPin = null // 車位
    apiData.value.caseInfo.caseParkingSqM = null // 車位
    apiData.value.caseInfo.caseBalconySqPin = null // 陽台
    apiData.value.caseInfo.caseBalconySqM = null // 陽台
    apiData.value.caseInfo.casePlatformSqPin = null // 平台
    apiData.value.caseInfo.casePlatformSqM = null // 平台
    apiData.value.caseInfo.caseTerraceSqPin = null // 露臺
    apiData.value.caseInfo.caseTerraceSqM = null // 露臺
    apiData.value.caseInfo.caseStairwellSqPin = null // 電 / 樓梯間
    apiData.value.caseInfo.caseStairwellSqM = null // 電 / 樓梯間
    apiData.value.caseInfo.caseMezzanineSqPin = null // 夾層
    apiData.value.caseInfo.caseMezzanineSqM = null // 夾層
    apiData.value.caseInfo.caseBasementSqPin = null // 地下室
    apiData.value.caseInfo.caseBasementSqM = null // 地下室
    apiData.value.caseInfo.caseOtherSqPin = null // 其他
    apiData.value.caseInfo.caseOtherSqM = null // 其他
    apiData.value.caseInfo.caseAmenitieSqPin = null // 公設
    apiData.value.caseInfo.caseAmenitieSqM = null // 公設
    apiData.value.caseInfo.caseAmenitieSqRqtio = null // 公設比
    apiData.value.caseInfo.isCaseAmenitieSqRqtioAuto = true // 公設比自動計算

    // 管理資訊
    apiData.value.caseInfo.caseManageTypeToken = null // 管理方式
    apiData.value.caseInfo.caseManageDutyToken = null // 管理時段
    apiData.value.caseInfo.caseManageFeePeriodToken = null // 管理費繳費方式
    apiData.value.caseInfo.caseManageFee = null // 管理費
  }

  if (code !== '8') {
    apiData.value.caseInfo.caseLandNo = null // 地號
  }

  if (code === '7') {
    // 價格資訊
    apiData.value.caseInfo.casePrice = null // 含車位
    apiData.value.caseInfo.casePriceUnit = null // 單價
    apiData.value.caseInfo.isCasePriceUnitAuto = true // 自動計算

    //
    apiData.value.caseInfo.isCaseParking = true
  }

  if (code === '8') {
    // 地址
    apiData.value.caseInfo.lane = null // 巷
    apiData.value.caseInfo.alley = null // 弄
    apiData.value.caseInfo.addrNum = null // 號
    apiData.value.caseInfo.addrNumOf = null // 之號
    apiData.value.caseInfo.floor = null // 樓
    apiData.value.caseInfo.addrNumOfFloor = null // 之樓

    // 出售樓層
    apiData.value.caseInfo.isSingleFloor = true // 出售樓層
    apiData.value.caseInfo.floorFromToken = 1 // 開始樓層類型
    apiData.value.caseInfo.caseFloorFrom = null // 開始樓層
    apiData.value.caseInfo.floorToToken = 1 // 結束樓層類型
    apiData.value.caseInfo.caseFloorTo = null // 結束樓層

    // 總樓高
    apiData.value.caseInfo.caseFloorTotal = null // 總樓高

    // 電梯
    apiData.value.caseInfo.isCaseHasElevator = true // 是否有電梯
    apiData.value.caseInfo.caseElevatorCount = null // 部

    // 建物結構
    apiData.value.caseInfo.caseStructureToken = null // 建物結構

    // 無障礙設施
    apiData.value.caseInfo.caseBarrierfreeToken = null // 無障礙設施

    // 車位資訊
    apiData.value.caseInfo.isCaseParking = true // 有無車位
    apiData.value.caseInfo.parkingInfos = [] // 資訊

    // 價格資訊
    apiData.value.caseInfo.caseParkingPrice = null // 車位價

    // 坪數資訊
    apiData.value.caseInfo.isCaseSqUnitPin = true // 顯示單位
    apiData.value.caseInfo.caseBuildSq = null // 登記坪數
    apiData.value.caseInfo.caseParkingSq = null // 登記坪數
    apiData.value.caseInfo.isCaseBuildSqIncludeParking = false // 含車位
    apiData.value.caseInfo.caseMainSqPin = null // 主建物
    apiData.value.caseInfo.caseMainSqM = null // 主建物

    // 照片資訊
    apiData.value.caseInfo.caseLayout = null // 格局圖
  }

  emits('change')
}
</script>

<template>
  <BuyMFormRadiosOval
    name="casePurposeToken"
    v-model="apiData.caseInfo.casePurposeToken"
    :options="options.casePurpose"
    :config="{
      schema: {
        label: 'text',
        value: 'code',
      },
    }"
    :rules="{
      required: '請選擇現況',
    }"
    @change="onChange"
  />
</template>

<style></style>
