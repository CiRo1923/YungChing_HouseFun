<script setup>
import { numberComma } from '@js/_prototype.js'
const buyHouse = useBuyHouseStore()
const { community } = storeToRefs(buyHouse)

const items = computed(() => {
  const { market, onSale, actualPrice } = community.value

  return [
    {
      id: 'market',
      label: '平均單價',
      value: numberComma.add(market.averageUnitPrice),
      unit: '萬 / 坪',
      note: `1${numberComma.add(market.minUnitPrice)} ~ 1${numberComma.add(market.maxUnitPrice)} 萬 / 坪`,
      class: {
        value: 'text-[--orange-e646]',
      },
    },
    {
      id: 'onSale',
      label: '待售物件',
      value: numberComma.add(onSale.count),
      unit: '筆',
      note: `${numberComma.add(market.maxPrice)} ~ ${numberComma.add(market.maxPrice)} 萬`,
    },
    {
      id: 'actualPrice',
      label: '實價登錄',
      value: numberComma.add(actualPrice.totalCount),
      unit: '筆',
      note: `近一年成交 ${actualPrice.currentYearCount} 筆`,
    },
  ]
})
</script>

<template>
  <ul class="m:space-y-[5px] pt:flex pt:items-center pt:gap-x-[5px] p:w-[480px]">
    <li class="pt:flex-1" v-for="(item, index) in items" :key="`${item.id}_${index}`">
      <div
        class="rounded-[6px] bg-[--gray-f7] text-[12px] m:flex m:items-baseline m:gap-x-[15px] tm:p-[10px] p:p-[16px]"
      >
        <b class="block font-medium m:self-center p:mb-[8px]">{{ item.label }}</b>
        <p class="m:grow">
          <b class="text-[20px]" :class="item?.class?.value">{{ item.value }}</b>
          {{ item.unit }}
        </p>
        <small class="block text-[--gray-666] p:mt-[4px]">{{ item.note }}</small>
      </div>
    </li>
  </ul>
</template>

<style lang="postcss"></style>
