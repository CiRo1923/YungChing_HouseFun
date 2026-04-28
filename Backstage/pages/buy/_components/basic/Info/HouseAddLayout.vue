<script setup>
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)

const items = shallowReadonly([
  {
    id: 'caseAddRoom',
    label: '房',
  },
  {
    id: 'caseAddLivingRoom',
    label: '廳',
  },
  {
    id: 'caseAddBathroom',
    label: '衛',
  },
  {
    id: 'caseAddBalcony',
    label: '陽台',
  },
])

const isError = computed(() => {
  const matchValue = items.filter((item) => !apiData.value.caseInfo[item.id])

  return apiData.value.caseInfo.isCaseAddtion && matchValue.length === items.length
})
</script>

<template>
  <div>
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
            isDisabled: !apiData.caseInfo.isCaseAddtion,
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
    <BuyMFormHidden
      name="HouseAddLayout"
      v-model="isError"
      :rules="{
        custom: {
          valid: !isError,
          errorMessage: '請輸入加蓋格局',
        },
      }"
    />
  </div>
</template>

<style></style>
