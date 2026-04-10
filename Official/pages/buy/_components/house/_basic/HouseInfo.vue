<script setup>
import { onToFixed } from '@js/_prototype.js'

import { useBuyHouseStore } from '@stores/buy/house.js'

const buyHouse = useBuyHouseStore()
const { basic, pin } = storeToRefs(buyHouse)

const houseInfo = computed(() => {
  const { buildAge } = basic.value
  const { build, main, balcony } = pin.value

  return [
    {
      id: 'pinBuild',
      label: '建坪',
      value: build,
      suffix: '坪',
    },
    {
      id: 'pinMainBalcony',
      label: '主 + 陽',
      value: onToFixed([main, balcony]),
      suffix: '坪',
    },
    {
      id: 'buildAge',
      label: '屋齡',
      value: buildAge,
      suffix: '年',
    },
  ]
})
</script>

<template>
  <ul class="flex justify-between pt:bg-[--gray-f7] p:rounded-[10px] p:px-[25px] p:py-[10px]">
    <li class="p:space-y-[4px]" v-for="(item, index) in houseInfo" :key="`${item.id}_${index}`">
      <p class="text-[18px]">
        <b class="text-[20px]">{{ item.value }}</b> {{ item.suffix }}
      </p>
      <small class="block text-[--gray-999] tm:text-[14px] p:text-[16px]">{{ item.label }}</small>
    </li>
  </ul>
</template>

<style></style>
