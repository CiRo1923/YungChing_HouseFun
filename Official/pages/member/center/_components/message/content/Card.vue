<script setup>
import { numberComma, onFormatDate } from '@js/_prototype.js'

const emits = defineEmits(['delete'])
// 勾選方塊是卡片的一部分(設計稿上它在卡片內),但選取的是整份清單的狀態 ——
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
// 規格書的欄位名是「留言時間」,設計稿的標籤寫「加入時間」——以規格書為準。
const messageSentAt = computed(() => onFormatDate(props.item.messageSentAt, 'YYYY/MM/DD'))
// 連結由後端給幾個就畫幾顆,文字用它自己的 title —— key 的值域還沒確認,不靠它挑。
const actions = computed(() => props.item.actions || [])
</script>

<template>
  <div class="flex tm:flex-col tm:gap-y-[10px] p:gap-x-[20px] p:py-[20px]">
    <CommonMFormCheckBox
      name="messageIds"
      v-model="selectedIds"
      :config="{
        value: props.item.id,
      }"
      :setClass="{
        main: '--checkbox-green-8d0d shrink-0',
      }"
    />
    <CommonMFigure
      :src="house.imageUrl"
      :alt="house.title"
      :setClass="{
        main: 'shrink-0 tm:h-[72px] tm:w-[95px] p:h-[132px] p:w-[174px]',
      }"
      v-if="house.imageUrl"
    />
    <div class="grow space-y-[5px]">
      <b class="block text-[16px]">{{ house.title }}</b>
      <p class="text-[14px] text-[--gray-666]">{{ house.address }}</p>
      <p class="text-[14px] text-[--gray-666]" v-if="house.communityName">
        {{ house.communityName }}
      </p>
      <p class="text-[14px] text-[--gray-666]">
        {{ house.buildPing }} 坪 | {{ house.roomText }}
      </p>
      <p class="text-[14px] text-[--gray-999]">留言時間：{{ messageSentAt }}</p>
      <p class="text-[14px] text-[--gray-666]" v-if="props.item.broker">
        {{ props.item.broker.name }} {{ props.item.broker.shopName }}
        {{ props.item.broker.mobilePhone }}
      </p>
    </div>
    <div class="shrink-0 space-y-[10px]">
      <p class="flex items-baseline justify-end gap-x-[5px] text-[--gray-666]">
        <span class="text-[12px] text-[--red-e45c]" v-if="props.item.priceDropAmount">
          ↓ {{ numberComma.add(props.item.priceDropAmount) }} 萬
        </span>
        <del class="text-[12px]" v-if="house.lastPrice">
          {{ numberComma.add(house.lastPrice) }} 萬
        </del>
        <span class="text-[12px] leading-[1.2] text-[--red-e45c]">
          <b class="text-[20px]">{{ numberComma.add(house.totalPrice) }}</b>
          萬
        </span>
      </p>
      <div class="flex gap-[10px] tm:justify-end">
        <CommonMAnchor
          text="刪除"
          :config="{
            icon: {
              name: 'icon_trash_can',
              position: 'left',
            },
          }"
          :setClass="{
            main: '--oval --border-gray-e5 --h-35 --px-15 --text-gray-666 gap-x-[5px]',
            text: 'text-[14px]',
            icon: 'h-[16px] w-[16px]',
          }"
          @click="emits('delete')"
        />
        <CommonMAnchor
          :text="action.title"
          :href="action.target"
          :config="{
            target: '_blank',
            icon: {
              name: 'icon_open_link',
              position: 'left',
            },
          }"
          :setClass="{
            main: '--oval --border-gray-e5 --h-35 --px-15 --text-gray-666 gap-x-[5px]',
            text: 'text-[14px]',
            icon: 'h-[16px] w-[16px]',
          }"
          v-for="action in actions"
          :key="action.key"
        />
      </div>
    </div>
  </div>
</template>
