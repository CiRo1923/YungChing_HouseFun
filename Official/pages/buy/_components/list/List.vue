<script setup>
import ListItem from '@pages/buy/_components/list/_list/Item.vue'

// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyListStore } from '@stores/buy/list.js'

// const project = useBuyProjectStore()
// const { options } = storeToRefs(project)
const buyList = useBuyListStore()
const { content } = storeToRefs(buyList)
</script>

<template>
  <ul
    class="list divide-y-[1px] divide-[--gray-feea] m:px-[10px] tm:space-y-[15px] p:space-y-[30px]"
  >
    <li
      v-for="(item, index) in content"
      :key="`${item.id}_${index}`"
      class="flex first:pt-0 m:flex-col-reverse t:gap-x-[15px] tm:pt-[15px] pt:flex-row-reverse p:gap-x-[20px] p:px-[30px] p:pt-[30px]"
    >
      <ListItem
        :item="item"
        :config="{
          index: index,
        }"
      />
    </li>
  </ul>
</template>

<style></style>
