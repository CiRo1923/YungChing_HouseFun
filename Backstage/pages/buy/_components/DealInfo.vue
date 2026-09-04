<script setup>
const buyProject = useBuyProjectStore()
const { serverTime } = storeToRefs(buyProject)
const { onApiGetCommonServerTime } = useBuyProjectActions()
const buyList = useBuyListStore()
const { apiDealData } = storeToRefs(buyList)
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
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

const onInit = () => {
  if (props.data && props.data.info) {
    apiDealData.value.dateDeal = props.data.info.dateDeal
  }
}

await useAsyncData('common-server-time', () => onApiGetCommonServerTime())

onInit()
</script>

<template>
  <div class="tm:space-y-[16px] p:space-y-[24px]" :class="setClass.main">
    <div
      class="space-y-[16px] rounded-[15px] bg-[--gray-f7] py-[32px] text-center tm:px-[16px] p:px-[40px]"
    >
      <div class="m:space-y-[16px] pt:inline-flex pt:gap-x-[16px]">
        <CommonMFormLabel
          label="成交日期"
          :setClass="{
            main: 'text-[16px] pt:shrink-0 p:flex p:h-[40px] p:items-center',
          }"
        />
        <BuyMDatepickerSingle
          name="dealDatepicker"
          v-model="apiDealData.dateDeal"
          :config="{
            /*
             * ⚠️ 成交日期一定要使用者自己選,不給預設。
             *
             * defaultIsToday 開著時,Field 綁的 datePickerModel 會在 model 還是
             * null 的情況下回傳「今天」的字串 —— 畫面看得到日期、required 也判定
             * 有值,但真正送出的 apiDealData.dateDeal 仍是 null,後端就回 400。
             * 關掉之後 get() 回空字串,required 才擋得住。
             */
            defaultIsToday: false,
            /* 日曆開啟時落在哪個月,以及可選的上限,都跟著伺服器時間走 */
            today: serverTime.value,
            maxDate: serverTime.value,
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
      <CommonMFormRadiosOval
        name="isDealShow"
        v-model="apiDealData.isDealShow"
        :options="dealShow"
        :setClass="{
          label: 'text-[16px]',
          radios: 'm:w-full',
          container: 'm:flex-1',
        }"
      />
    </div>
  </div>
</template>
