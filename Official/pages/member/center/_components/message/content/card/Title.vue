<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const house = computed(() => props.item.house || {})
</script>

<template>
  <CommonMAnchor
    :text="house.title"
    :to="{
      name: 'buy-house-hfid',
      params: {
        hfid: house.id,
      },
    }"
    :config="{
      // 規格書第六節寫「另開物件 C 端明細頁」—— 清單頁留在原地,回來不必重新載入。
      // 用具名分頁而不是 '_blank':連看十筆只會佔用一個分頁,
      // 第二筆之後是換掉那個分頁的內容。名稱要與其他開明細的地方一致,不同名就會各開一個。
      target: 'houseDetail',
    }"
    :setClass="{
      main: 'w-full underline',
      text: 'line-clamp-1 text-[16px] font-medium',
    }"
  />
</template>
