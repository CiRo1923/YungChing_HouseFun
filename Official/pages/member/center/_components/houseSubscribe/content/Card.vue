<script setup>
const emits = defineEmits(['compare', 'delete'])
// 勾選方塊是卡片的一部分,但選取的是整份清單的狀態 ——
// 所以值由使用端持有,這裡只把 v-model 轉給裡面的 checkbox。
const selectedIds = defineModel({
  type: Array,
  default: () => [],
})
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const house = computed(() => props.item.house || {})
const isSelected = computed(() => selectedIds.value.includes(props.item.id))
</script>

<template>
  <div
    class="flex flex-wrap items-center transition-colors duration-300 tm:gap-[10px] tm:rounded-[10px] tm:border-[1px] tm:p-[15px] p:flex-nowrap p:gap-[20px] p:px-[10px] p:py-[20px]"
    :class="[
      { 'bg-[--green-ffe9] tm:border-[--green-8b0d]': isSelected },
      { 'bg-[--white] tm:border-transparent': !isSelected },
    ]"
  >
    <CommonMFormCheckBox
      name="houseSubscribeIds"
      v-model="selectedIds"
      :config="{
        value: props.item.id,
      }"
      :setClass="{
        main: '--checkbox-green-8d0d shrink-0 tm:w-full',
      }"
    />
    <CommonMFigure
      :src="house.imageUrl"
      :alt="house.title"
      :setClass="{
        main: 'shrink-0 overflow-hidden rounded-[5px] tm:h-[72px] tm:w-[95px] p:h-[132px] p:w-[174px]',
      }"
    />
    <!-- 手機把經紀人與時間移到縮圖下方全寬,桌機留在資訊欄裡 —— contents 讓這一層在手機消失。 -->
    <div class="min-w-0 grow m:contents pt:space-y-[5px]">
      <!-- flex-1 的基準寬度是 0,不吃內容寬度 —— 標題再長都不會把自己擠到縮圖下一行;
        min-w-0 讓它縮得到內容以下,line-clamp 才截得斷。 -->
      <div class="min-w-0 flex-1 pt:space-y-[5px]">
        <PageMemberCenterHouseSubscribeContentCardTitle :item="props.item" />
        <PageMemberCenterHouseSubscribeContentCardAddressInfo :item="props.item" />
        <PageMemberCenterHouseSubscribeContentCardBasicInfo :item="props.item" />
      </div>
      <div class="m:flex m:w-full m:flex-col-reverse pt:space-y-[5px]">
        <PageMemberCenterHouseSubscribeContentCardTimeInfo :item="props.item" />
        <PageMemberCenterHouseSubscribeContentCardBrokerInfo :item="props.item" />
      </div>
    </div>
    <PageMemberCenterHouseSubscribeContentCardPriceInfo :item="props.item" />
    <PageMemberCenterHouseSubscribeContentCardActions
      :item="props.item"
      @compare="emits('compare')"
      @delete="emits('delete')"
    />
  </div>
</template>
