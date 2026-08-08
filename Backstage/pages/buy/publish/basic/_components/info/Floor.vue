<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
const radioOptions = readonly([
  {
    label: '單層',
    value: true,
  },
  {
    label: '多層',
    value: false,
  },
])

// 提供給 hidden 欄位當 model,起訖任一格(含樓層類型)變動即觸發重新驗證
const floorRange = computed(() => {
  const { floorFromToken, caseFloorFrom, floorToToken, caseFloorTo } = apiData.value.caseInfo

  return [floorFromToken, caseFloorFrom, floorToToken, caseFloorTo].join('_')
})

const onIsSingleFloorChange = () => {
  apiData.value.caseInfo.floorToToken = 1
  apiData.value.caseInfo.caseFloorTo = null
}

// 多層時起訖樓層需升冪(結束 > 開始),同時擋掉起訖填一樣的情況。
// 先比樓層類型,同類型才比數字,例如「地下 2 樓 ~ 地上 3 樓」通過、「5 樓 ~ 2 樓」不通過。
const onFloorVaild = () => {
  const { isSingleFloor, floorFromToken, caseFloorFrom, floorToToken, caseFloorTo } =
    apiData.value.caseInfo

  if (isSingleFloor) return true

  // 樓層類型排序
  const floorTypeOrder = {
    2: 0, // 地下
    1: 1, // 地上
    3: 2, // 加蓋
  }
  const fromType = floorTypeOrder[floorFromToken]
  const toType = floorTypeOrder[floorToToken]
  const hasValue = (value) => value != null && value !== ''

  if (fromType == null || toType == null) return true
  if (!hasValue(caseFloorFrom) || !hasValue(caseFloorTo)) return true
  if (fromType !== toType) return toType > fromType

  return Number(caseFloorTo) > Number(caseFloorFrom)
}
</script>

<template>
  <PageBuyPublishBasicRadiosOval>
    <BuyMFormRadiosOval
      name="isSingleFloor"
      v-model="apiData.caseInfo.isSingleFloor"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onIsSingleFloorChange"
    />
    <BuyMFormHidden
      name="caseFloor"
      v-model="floorRange"
      :rules="{
        custom: {
          valid: onFloorVaild(),
          errorMessage: '樓層需由低至高填寫,且不可相同',
        },
      }"
      :setClass="{
        error: 'mt-[4px]',
      }"
      v-slot="{ isError }"
    >
      <ul class="m:space-y-[8px] pt:flex pt:gap-x-[8px]">
        <li class="flex grow gap-x-[8px] overflow-hidden">
          <BuyMFormSelect
            name="floorFromToken"
            v-model.number="apiData.caseInfo.floorFromToken"
            :options="options.floor"
            :config="{
              placeholder: '請選擇',
              schema: {
                label: 'text',
                value: 'value',
              },
              isError,
            }"
            :setClass="{
              main: '--h-40 --px-12 --py-8 shrink-0',
            }"
          />
          <BuyMFormInput
            name="caseFloorFrom"
            v-model.number="apiData.caseInfo.caseFloorFrom"
            :config="{
              inputMode: 'numeric',
              inputChinese: false,
              checkNotIsZero: true,
              integer: true,
              isExistClose: false,
              hasClearButton: false,
              maxlength: 3,
              isError,
            }"
            :rules="{
              required: '請輸入樓層',
            }"
            :setClass="{
              main: '--h-40 --px-12 --py-8 p:grow',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
          >
            <template #rearAssist>樓</template>
          </BuyMFormInput>
        </li>
        <li class="m:hidden pt:shrink-0" v-if="!apiData.caseInfo.isSingleFloor">
          <span class="text-[16px] text-[--gray-666] pt:flex pt:h-[40px] pt:items-center">~</span>
        </li>
        <li class="flex grow gap-x-[8px] overflow-hidden" v-if="!apiData.caseInfo.isSingleFloor">
          <BuyMFormSelect
            name="floorToToken"
            v-model.number="apiData.caseInfo.floorToToken"
            :options="options.floor"
            :config="{
              placeholder: '請選擇',
              schema: {
                label: 'text',
                value: 'value',
              },
              isError,
            }"
            :setClass="{
              main: '--h-40 --px-12 --py-8 shrink-0',
            }"
          />
          <BuyMFormInput
            name="caseFloorTo"
            v-model.number="apiData.caseInfo.caseFloorTo"
            :config="{
              inputMode: 'numeric',
              inputChinese: false,
              checkNotIsZero: true,
              integer: true,
              isExistClose: false,
              hasClearButton: false,
              maxlength: 3,
              isError,
            }"
            :rules="{
              required: '請輸入樓層',
            }"
            :setClass="{
              main: '--h-40 --px-12 --py-8 grow',
              element: 'grow',
              rearAssist: 'text-[14px] text-[--gray-999]',
            }"
          >
            <template #rearAssist>樓</template>
          </BuyMFormInput>
        </li>
      </ul>
    </BuyMFormHidden>
  </PageBuyPublishBasicRadiosOval>
</template>

<style></style>
