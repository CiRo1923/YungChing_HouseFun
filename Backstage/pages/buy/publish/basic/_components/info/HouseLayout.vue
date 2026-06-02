<script setup>
// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

const items = shallowReadonly([
  {
    id: 'caseRoom',
    label: '房',
  },
  {
    id: 'caseLivingRoom',
    label: '廳',
  },
  {
    id: 'caseBathroom',
    label: '衛',
  },
  {
    id: 'caseBalcony',
    label: '陽台',
  },
])

const isError = computed(() => {
  const matchValue = items.filter((item) => !apiData.value.caseInfo[item.id])

  return matchValue.length === items.length && !apiData.value.caseInfo.isCaseOpenConcept
})

const onIsCaseAddtionChange = () => {
  if (apiData.value.caseInfo.isCaseAddtion) return

  apiData.value.caseInfo.caseAddRoom = null
  apiData.value.caseInfo.caseAddLivingRoom = null
  apiData.value.caseInfo.caseAddBathroom = null
  apiData.value.caseInfo.caseAddBalcony = null
}

const onIsCaseOpenConceptChange = () => {
  if (!apiData.value.caseInfo.isCaseOpenConcept) return

  apiData.value.caseInfo.caseRoom = null
  apiData.value.caseInfo.caseLivingRoom = null
  apiData.value.caseInfo.caseBathroom = null
  apiData.value.caseInfo.caseBalcony = null
}
</script>

<template>
  <div>
    <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
      <li>
        <ul class="flex flex-wrap gap-x-[8px] gap-y-[12px]">
          <li
            class="m:w-[151px] t:w-[90px] p:w-[100px]"
            v-for="(item, index) in items"
            :key="`${item.id}_${index}`"
          >
            <BuyMFormInput
              :name="item.id"
              v-model.number="apiData.caseInfo[item.id]"
              :config="{
                inputMode: 'numeric',
                inputChinese: false,
                checkNotIsZero: true,
                integer: true,
                maxlength: 2,
                isExistClose: false,
                hasClearButton: false,
                isDisabled: apiData.caseInfo.isCaseOpenConcept,
                isError: isError,
              }"
              :setClass="{
                main: '--h-40 --px-12 --py-8',
                element: 'grow',
                rearAssist: 'text-[14px] text-[--gray-999]',
              }"
            >
              <template #rearAssist>{{ item.label }}</template>
            </BuyMFormInput>
          </li>
        </ul>
      </li>
      <li class="flex h-[40px] items-center">
        <BuyMFormCheckBox
          name="isCaseOpenConcept"
          v-model="apiData.caseInfo.isCaseOpenConcept"
          :config="{
            mode: 'boolean',
            label: '開放式格局',
          }"
          :setClass="{
            label: 'text-[16px]',
          }"
          @change="onIsCaseOpenConceptChange"
        />
      </li>
      <li class="flex h-[40px] items-center">
        <BuyMFormCheckBox
          name="isCaseAddtion"
          v-model="apiData.caseInfo.isCaseAddtion"
          :config="{
            mode: 'boolean',
            label: '有加蓋',
          }"
          :setClass="{
            label: 'text-[16px]',
          }"
          @change="onIsCaseAddtionChange"
        />
      </li>
    </ul>
    <BuyMFormHidden
      name="HouseLayout"
      v-model="isError"
      :rules="{
        custom: {
          valid: !isError,
          errorMessage: '請輸入格局',
        },
      }"
      :setClass="{
        error: 'mt-[4px]',
      }"
    />
  </div>
</template>

<style></style>
