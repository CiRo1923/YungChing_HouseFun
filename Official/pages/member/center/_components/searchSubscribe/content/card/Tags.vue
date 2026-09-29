<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})

const tags = computed(() => props.item.conditionTags || [])

// 卡片被選取時整張換成淺綠底,標籤原本的灰底在那上面看不出來,所以改用白底。
const bgClass = computed(() => (props.isSelected ? '--bg-white' : '--bg-gray-f2'))
</script>

<template>
  <!-- 訂閱時存下來的搜尋條件,規格書第七節寫明以標籤呈現、不可在這一頁編輯,
    所以每一顆都只是文字,沒有點擊行為。 -->
  <ul class="flex flex-wrap gap-x-[10px] gap-y-[8px]">
    <li v-for="(tag, index) in tags" :key="`${tag}_${index}`">
      <CommonMTagDefault
        :label="tag"
        :setClass="{
          main: ['--rounded-4 --text-gray-333 --px-10 --py-5', bgClass],
          label: 'text-[14px]',
        }"
      />
    </li>
  </ul>
</template>
