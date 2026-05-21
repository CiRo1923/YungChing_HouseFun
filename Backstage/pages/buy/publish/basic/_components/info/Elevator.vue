<script setup>
// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

const radioOptions = readonly([
  {
    label: '無電梯',
    value: false,
  },
  {
    label: '有電梯',
    value: true,
  },
])

const onIsCaseHasElevatorChnage = () => {
  if (!apiData.value.caseInfo.isCaseHasElevator) {
    apiData.value.caseInfo.caseElevatorCount = null
  }
}
</script>

<template>
  <PageBuyPublishBasicRadiosOval>
    <BuyMFormRadiosOval
      name="isCaseHasElevator"
      v-model="apiData.caseInfo.isCaseHasElevator"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onIsCaseHasElevatorChnage"
    />
    <ul>
      <li class="t:w-[90px] p:w-[100px]">
        <BuyMFormInput
          name="caseElevatorCount"
          v-model.number="apiData.caseInfo.caseElevatorCount"
          :config="{
            inputMode: 'numeric',
            inputChinese: false,
            checkNotIsZero: true,
            integer: true,
            maxlength: 3,
            isExistClose: false,
            hasClearButton: false,
            isDisabled: !apiData.caseInfo.isCaseHasElevator,
          }"
          :rules="{
            required: {
              valid: apiData.caseInfo.isCaseHasElevator,
              errorMessage: '請輸入電梯數量',
            },
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8',
            element: 'grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
        >
          <template #rearAssist>部</template>
        </BuyMFormInput>
      </li>
    </ul>
  </PageBuyPublishBasicRadiosOval>
</template>

<style></style>
