<script setup>
const emits = defineEmits(['delete'])
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

const isSelected = computed(() => selectedIds.value.includes(props.item.id))

const onDelete = () => emits('delete')
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
      name="searchSubscribeIds"
      v-model="selectedIds"
      :config="{
        value: props.item.id,
      }"
      :setClass="{
        main: '--checkbox-green-8d0d shrink-0 tm:w-full',
      }"
    />
    <!-- 條件標籤與加入時間收在同一欄:手機整行、桌機與平板吃掉中間剩下的寬度。 -->
    <div class="min-w-0 space-y-[10px] m:w-full pt:grow">
      <PageMemberCenterSearchSubscribeContentCardTags :item="props.item" />
      <PageMemberCenterSearchSubscribeContentCardTimeInfo :item="props.item" />
    </div>
    <PageMemberCenterSearchSubscribeContentCardMatchedInfo :item="props.item" />
    <PageMemberCenterSearchSubscribeContentCardActions
      :item="props.item"
      @delete="onDelete"
    />
  </div>
</template>
