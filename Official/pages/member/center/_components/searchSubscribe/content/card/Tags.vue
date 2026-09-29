<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const tags = computed(() => props.item.conditionTags || [])
</script>

<template>
  <!-- 訂閱時存下來的搜尋條件,規格書第七節寫明以標籤呈現、不可在這一頁編輯,
    所以每一顆都只是文字,沒有點擊行為。 -->
  <ul class="flex flex-wrap gap-[8px]">
    <li
      class="rounded-[5px] bg-[--gray-f2] px-[10px] py-[5px] text-[16px] text-[--gray-666]"
      v-for="(tag, index) in tags"
      :key="`${tag}_${index}`"
    >
      {{ tag }}
    </li>
  </ul>
</template>
