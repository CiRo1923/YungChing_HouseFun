<script setup>
// 買屋降價通知的主體。欄位依規格書 C203-1 §四「買屋降價通知」的介面對照:
// 物件照片、物件資訊、經紀人與通知時間、價格、功能(留言 / 刪除)。
const emits = defineEmits(['delete'])
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const house = computed(() => props.item.house || {})

const onDelete = () => emits('delete')
</script>

<template>
  <div class="flex min-w-0 grow items-center m:flex-wrap m:gap-[10px] pt:gap-[20px]">
    <!-- 沒有封面照時 MFigure 自己會換成預設圖(規格書:缺封面照顯示系統預設圖) -->
    <CommonMFigure
      :src="house.media?.images?.[0]"
      :alt="house.title"
      :setClass="{
        main: 'shrink-0 overflow-hidden rounded-[5px] m:h-[72px] m:w-[95px] pt:h-[132px] pt:w-[174px]',
      }"
    />
    <!-- 手機把經紀人那一列移到縮圖下方全寬,桌機留在資訊欄裡 —— contents 讓這一層在手機消失。 -->
    <div class="min-w-0 grow m:contents pt:space-y-[15px]">
      <!-- flex-1 的基準寬度是 0,標題再長都不會把自己擠到縮圖下一行;
        min-w-0 讓它縮得到內容以下,line-clamp 才截得斷。 -->
      <div class="min-w-0 flex-1 space-y-[5px]">
        <PageMemberCenterNoticeContentCardTitle :item="props.item" />
        <PageMemberCenterNoticeContentCardAddressInfo :item="props.item" />
      </div>
      <PageMemberCenterNoticeContentCardBrokerInfo :item="props.item" class="m:w-full" />
    </div>
    <PageMemberCenterNoticeContentCardPriceInfo :item="props.item" />
    <PageMemberCenterNoticeContentCardActions @delete="onDelete" />
  </div>
</template>
