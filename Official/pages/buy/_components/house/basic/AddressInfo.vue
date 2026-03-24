<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

import { useHouseStore } from '@stores/buy/house.js'

const house = useHouseStore()
const { detail, basic } = storeToRefs(house)

const addressInfo = readonly([
  {
    id: 'address',
    value: basic.value.address,
    icon: 'icon_loaction',
  },
  {
    id: 'community',
    value: detail.value?.community,
    icon: 'icon_community',
  },
])
</script>

<template>
  <ul class="pt:flex pt:items-center p:gap-x-[25px]">
    <template v-for="(data, index) in addressInfo" :key="`${data.id}_${index}`">
      <li v-if="data.value">
        <p class="flex items-center gap-x-[3px] text-[16px] tracking-default">
          <SvgIcon :icon="data.icon" class="h-[18px] w-[18px] text-[--green-8b0d]" />
          <em>{{ data.value }}</em>
        </p>
      </li>
    </template>
  </ul>
</template>

<style></style>
