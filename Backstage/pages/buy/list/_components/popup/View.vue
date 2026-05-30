<script setup>
import { numberComma } from '@js/_prototype.js'
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
const thead = readonly([
  {
    id: 'dateView',
    label: '日期',
  },
  {
    id: 'counts',
    label: '瀏覽數',
    type: 'comma',
  },
  {
    id: 'isGolden',
    label: '黃金曝光',
  },
])

const total = computed(() => customData.value.data.reduce((sum, item) => sum + item.counts, 0))
</script>

<template>
  <BuyCommonCustomPopup
    id="popupView"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
      headerTools: 'text-[--gray-666] tm:gap-x-[12px] tm:text-[14px] p:gap-x-[24px] p:text-[16px]',
    }"
  >
    <template #headerTools>
      <p class="grow">每日 00:00 更新數據</p>
      <span>總計：{{ numberComma.add(total) }}</span>
    </template>
    <BuyMTableDefault
      :thead="thead"
      :tbody="customData.data"
      :config="{
        isTheadFixed: true,
      }"
      :setClass="{
        main: '--rounded --thead-gray-f7',
        container: 'p:max-h-[365px]',
        theadLabel: 'font-normal',
        tbodyTd: 'text-center',
      }"
    >
      <template #isGolden="{ value }">
        <CommonSvgIcon
          icon="icon_check_solid"
          class="mx-auto h-[20px] w-[20px] text-[--orange-e646]"
          :class="{ invisible: !value }"
        />
      </template>
    </BuyMTableDefault>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
