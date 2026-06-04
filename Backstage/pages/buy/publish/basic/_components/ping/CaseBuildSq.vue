<script setup>
// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { pingUnitLabel, onPingVaild, onPinSqMetersConvert } = useBuyPublishActions()
const { apiData, pingData } = storeToRefs(buyPublish)

const casePurposeToken = computed(() => apiData.value.caseInfo.casePurposeToken)
</script>

<template>
  <ul class="flex overflow-hidden tm:gap-x-[16px] p:gap-x-[24px]">
    <li class="m:min-w-0 m:grow t:w-[220px] p:w-[270px]">
      <BuyMFormInput
        name="caseBuildSq"
        v-model.number="pingData.caseBuildSq"
        :config="{
          inputMode: 'numeric',
          inputChinese: false,
          checkNotIsZero: true,
        }"
        :rules="{
          required: '請輸入登記坪數',
          custom: {
            valid: onPingVaild(),
            errorMessage: apiData.caseInfo.isCaseBuildSqIncludeParking
              ? '登記坪數 (含車位) 不得小於主建物坪數'
              : '登記坪數不得小於主建物坪數',
          },
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
        @blur="onPinSqMetersConvert('caseBuildSq')"
      >
        <template #rearAssist>{{ pingUnitLabel }}</template>
      </BuyMFormInput>
    </li>
    <!-- 1: 住宅 2: 店面 3: 住店 4: 辦公 5: 住辦 6: 廠房 7: 車位 8: 土地 9: 其他 -->
    <li class="flex h-[40px] items-center m:shrink-0" v-if="casePurposeToken !== '7'">
      <BuyMFormCheckBox
        name="isCaseBuildSqIncludeParking"
        v-model="apiData.caseInfo.isCaseBuildSqIncludeParking"
        :config="{
          mode: 'boolean',
          label: '含車位',
        }"
        :setClass="{
          label: 'text-[16px]',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
