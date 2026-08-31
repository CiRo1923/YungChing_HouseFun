<script setup>
import { onToFixed } from '@js/_prototype.js'

// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { pingUnitLabel, onPinSqMetersConvert } = useBuyPublishActions()
const { apiData, pingData } = storeToRefs(buyPublish)

const onIsCaseAmenitieSqRatioAuto = () => {
  const {
    isCaseAmenitieSqRatioAuto, // 自動計算
    caseAmenitieSqPin, // 公設坪數
    caseBuildSqPin, // 登記坪數
    caseParkingSqPin, // 車位坪數
    isCaseBuildSqIncludeParking, // 登記坪數含車位
  } = apiData.value.caseInfo

  if (!isCaseAmenitieSqRatioAuto || !caseAmenitieSqPin || !caseBuildSqPin) return

  // 登記坪數含車位時先扣除車位，與單價自動計算的分母定義一致
  const buildSq =
    isCaseBuildSqIncludeParking && caseParkingSqPin
      ? Number(caseBuildSqPin) - Number(caseParkingSqPin)
      : Number(caseBuildSqPin)

  if (!buildSq) return

  apiData.value.caseInfo.caseAmenitieSqRatio = Number(
    onToFixed((Number(caseAmenitieSqPin) / buildSq) * 100, 2)
  )
}

watch(
  () => [
    apiData.value.caseInfo.caseAmenitieSqPin,
    apiData.value.caseInfo.caseBuildSqPin,
    apiData.value.caseInfo.caseParkingSqPin,
    apiData.value.caseInfo.isCaseBuildSqIncludeParking,
    apiData.value.caseInfo.isCaseAmenitieSqRatioAuto,
  ],
  () => {
    onIsCaseAmenitieSqRatioAuto()
  }
)
</script>

<template>
  <ul class="m:space-y-[12px] t:gap-x-[8px] pt:flex pt:flex-wrap p:gap-x-[24px]">
    <li>
      <ul class="m:space-y-[12px] pt:flex pt:gap-x-[8px]">
        <li class="t:w-[220px] p:w-[270px]">
          <CommonMFormInput
            name="caseAmenitieSq"
            v-model.number="pingData.caseAmenitieSq"
            :config="{
              inputMode: 'numeric',
              inputChinese: false,
              checkNotIsZero: true,
            }"
            :setClass="{
              type: 'text-[16px]',
              main: '--h-40 --px-12 --py-8',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
            @blur="onPinSqMetersConvert('caseAmenitieSq')"
          >
            <template #rearAssist>{{ pingUnitLabel }}</template>
          </CommonMFormInput>
        </li>
        <li class="t:w-[220px] p:w-[270px]">
          <CommonMFormInput
            name="caseAmenitieSqRatio"
            v-model.number="apiData.caseInfo.caseAmenitieSqRatio"
            :config="{
              placeholder: '公設比',
              inputMode: 'numeric',
              inputChinese: false,
              isDisabled: apiData.caseInfo.isCaseAmenitieSqRatioAuto,
            }"
            :setClass="{
              type: 'text-[16px]',
              main: '--h-40 --px-12 --py-8',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
          >
            <template #rearAssist>%</template>
          </CommonMFormInput>
        </li>
      </ul>
    </li>
    <li class="flex items-center pt:h-[40px]">
      <CommonMFormCheckBox
        name="isCaseAmenitieSqRatioAuto"
        v-model="apiData.caseInfo.isCaseAmenitieSqRatioAuto"
        :config="{
          mode: 'boolean',
          label: '自動計算',
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
  </ul>
</template>
