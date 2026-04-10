<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

import { useBuyHouseStore } from '@stores/buy/house.js'

const buyHouse = useBuyHouseStore()
const { detail, basic } = storeToRefs(buyHouse)

const addressInfo = computed(() => {
  const { address } = basic.value
  const { community } = detail.value
  const { name } = community || {}

  return [
    {
      id: 'address',
      value: address,
      icon: 'icon_loaction',
    },
    {
      id: 'community',
      value: name,
      icon: 'icon_community',
    },
  ]
})
</script>

<template>
  <ul class="pt:flex pt:items-center p:gap-x-[25px]">
    <template v-for="(data, index) in addressInfo" :key="`${data.id}_${index}`">
      <li v-if="data.value">
        <p class="flex items-center gap-x-[3px] text-[16px] tracking-default">
          <SvgIcon :icon="data.icon" class="h-[18px] w-[18px] shrink-0 text-[--green-8b0d]" />
          <em class="grow">{{ data.value }}</em>
        </p>
      </li>
    </template>
  </ul>
</template>

<style></style>
