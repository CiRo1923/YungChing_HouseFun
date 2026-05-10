<script setup>
import { useBuyListStore } from '@stores/buy/list.js'

const buyList = useBuyListStore()
const { apiDealData } = storeToRefs(buyList)
const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

const dealShow = readonly([
  {
    label: '顯示',
    value: true,
  },
  {
    label: '不顯示',
    value: false,
  },
])
</script>

<template>
  <div class="tm:space-y-[16px] p:space-y-[24px]" :class="setClass.main">
    <div
      class="space-y-[16px] rounded-[15px] bg-[--gray-f7] py-[32px] text-center tm:px-[16px] p:px-[40px]"
    >
      <div class="m:space-y-[16px] pt:inline-flex pt:gap-x-[16px]">
        <BuyMFormLabel
          label="成交日期"
          :setClass="{
            main: 'pt:shrink-0 p:flex p:h-[40px] p:items-center',
          }"
        />
        <BuyMDatepickerSingle
          name="dealDatepicker"
          v-model="apiDealData.dateDeal"
          :config="{
            defaultIsToday: false,
            maxDate: +new Date(),
          }"
          :rules="{
            required: '請選擇成交日期',
          }"
          :setClass="{
            main: '--h-40',
          }"
        />
      </div>
      <small class="block text-[14px] text-[--gray-666]">(僅供於後台查看)</small>
    </div>
    <div
      class="m:space-y-[16px] t:gap-x-[16px] pt:flex pt:items-center pt:justify-center p:gap-x-[24px]"
    >
      <p class="text-[16px] tracking-wider text-[--gray-666]">
        是否公開在個人店舖的
        <BuyMAnchor
          href="javascript:;"
          :setClass="{
            main: '--text-green-6a2d underline',
          }"
        >
          成交實績
        </BuyMAnchor>
        中，並顯示物件成交頁
        <small class="text-[14px]">(僅顯示部份資料)</small>？
      </p>
      <BuyMFormRadiosOval
        name="isDealShow"
        v-model="apiDealData.isDealShow"
        :options="dealShow"
        :setClass="{
          radios: 'm:w-full',
          container: 'm:flex-1',
        }"
      />
    </div>
  </div>
</template>

<style lang="postcss"></style>
