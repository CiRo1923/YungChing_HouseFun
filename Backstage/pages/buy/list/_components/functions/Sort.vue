<script setup>
const buyList = useBuyListStore()
const { apiSearchData } = storeToRefs(buyList)

const emits = defineEmits(['update'])
const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
})

// 搜尋無結果時整個功能列會被卸載(Content.vue 的 v-if="hasData"),排序元件的選中狀態
// 是它自己的 ref,重新掛載就回到預設 —— 但 store 的 token 沒變,畫面會顯示「預設」卻仍照舊排序。
// 把 store 的排序回傳給元件,讓它重新掛載時能還原。
const activeSort = computed(() => ({
  key: apiSearchData.value.listSortToken,
  sort: apiSearchData.value.listOrderToken,
}))

const onClick = (item) => {
  const { value } = item
  const isObject = typeof value === 'object'
  apiSearchData.value.listSortToken = isObject ? value.key : value
  apiSearchData.value.listOrderToken = isObject ? value.sort : 2

  emits('update')
}
</script>

<template>
  <div class="ml-auto flex items-center m:order-4">
    <span
      class="relative text-[14px] text-[--gray-666] after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-[--gray-ccce] after:content-default tm:mr-[8px] tm:pr-[8px] p:mr-[16px] p:pr-[16px]"
    >
      排序
    </span>
    <BuyMSortMain
      :options="props.options"
      :config="{
        index: 0,
        active: activeSort,
        mode: {
          m: 'dropdown',
        },
      }"
      @click="onClick"
    />
  </div>
</template>

<style lang="postcss"></style>
