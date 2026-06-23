<script setup>
// const project = useBuyProjectStore()
// const { options } = storeToRefs(project)
const buyList = useBuyListStore()
const { content } = storeToRefs(buyList)
</script>

<template>
  <ul class="list m:px-[10px]">
    <li
      class="relative flex border-b-[1px] border-b-[--gray-feea] m:flex-col t:gap-x-[15px] tm:py-[15px] p:gap-x-[20px] p:py-[30px]"
      v-for="(item, index) in content"
      :key="`${item.id}_${index}`"
    >
      <PageBuyListContentItem
        :item="item"
        :config="{
          index: index,
        }"
      />
    </li>
  </ul>
</template>

<style></style>
