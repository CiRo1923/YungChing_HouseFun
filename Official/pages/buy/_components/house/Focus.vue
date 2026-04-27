<script setup>
import Content from '@pages/buy/_components/house/_Content.vue'
import Label from '@pages/buy/_components/house/_Label.vue'

import { useBuyHouseStore } from '@stores/buy/house.js'

const buyHouse = useBuyHouseStore()
const { highlights } = storeToRefs(buyHouse)
const datas = computed(() => {
  return highlights.value.map((item) => ({
    label: item.title,
    content: item.context,
  }))
})
</script>

<template>
  <Content title="物件焦點">
    <div
      class="focus-container divide-y-[1px] divide-[--gray-ccce] tm:space-y-[20px] p:space-y-[30px]"
    >
      <ul>
        <li class="flex" v-for="(item, index) in datas" :key="`${item.label}_${index}`">
          <Label :text="item.label" />
          <p>{{ item.content }}</p>
        </li>
      </ul>
    </div>
  </Content>
</template>

<style></style>
