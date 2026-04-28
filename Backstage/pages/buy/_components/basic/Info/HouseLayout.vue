<script setup>
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)

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

  return matchValue.length === items.length
})

const onIsCaseAddtionChange = () => {
  if (!apiData.value.caseInfo.isCaseAddtion) {
    apiData.value.caseInfo.caseAddRoom = null
    apiData.value.caseInfo.caseAddLivingRoom = null
    apiData.value.caseInfo.caseAddBathroom = null
    apiData.value.caseInfo.caseAddBalcony = null
  }
}
</script>

<template>
  <div>
    <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
      <li>
        <ul class="flex flex-wrap gap-x-[8px] gap-y-[12px]">
          <li
            class="tm:w-[151px] p:w-[100px]"
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
    />
  </div>
</template>

<style></style>
