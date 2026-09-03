<script setup>
const props = defineProps({
  // 目前進行到第幾步(1 手機驗證 / 2 重設密碼 / 3 設定完成)
  step: {
    type: Number,
    default: 1,
  },
})

// TODO: icon 待補 —— 設計稿的「手機裝置」與「鎖」sprite 裡都沒有
// (icon_phone 是聽筒、icon_certification 只是暫代),補進 _svg/ 後改這裡的 icon 名。
const items = readonly([
  {
    icon: 'icon_phone',
    text: '手機驗證',
  },
  {
    icon: 'icon_certification',
    text: '重設密碼',
  },
  {
    icon: 'icon_check_solid',
    text: '設定完成',
    // 設計稿的第三步是實心圓底 + 白勾,sprite 只有純勾 → 用圓底容器包起來
    hasCircle: true,
  },
])

const onIsDone = (index) => index + 1 <= props.step
</script>

<template>
  <ul
    class="mx-auto flex w-fit items-center rounded-full bg-[--gray-f7] tm:gap-x-[10px] tm:px-[20px] tm:py-[15px] p:gap-x-[15px] p:px-[25px] p:py-[10px]"
  >
    <template v-for="(item, index) in items" :key="item.text">
      <li
        class="flex items-center tm:flex-col tm:gap-y-[5px] p:gap-x-[5px]"
        :class="onIsDone(index) ? 'text-[--green-8b0d]' : 'text-[--gray-999]'"
      >
        <span
          class="flex h-[20px] w-[20px] items-center justify-center rounded-full"
          :class="{
            'bg-[--green-8b0d] p-[5px] text-[--white]': item.hasCircle && onIsDone(index),
            'bg-[--gray-ccce] p-[5px] text-[--white]': item.hasCircle && !onIsDone(index),
          }"
        >
          <CommonSvgIcon :icon="item.icon" class="h-full w-full" />
        </span>
        <em class="font-medium tm:text-[14px] p:text-[16px]">{{ item.text }}</em>
      </li>
      <li class="text-[--gray-ccce]" v-if="index < items.length - 1">
        <CommonSvgIcon icon="chevron_right" class="h-[16px] w-[16px]" />
      </li>
    </template>
  </ul>
</template>
