<script setup>
import ListItem from '@pages/buy/_components/ListItem.vue'

// import { useProjectStore } from '@stores/buy/project.js'
import { useHomeStore } from '@stores/buy/home.js'

// const project = useProjectStore()
const home = useHomeStore()
// const { options } = storeToRefs(project)
const { content } = storeToRefs(home)
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
