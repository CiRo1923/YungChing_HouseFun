<script setup>
import { onLayoutText, onFloorText } from '@js/_projectPrototype.js'

const buyHouse = useBuyHouseStore()
const { basic, pin, floor } = storeToRefs(buyHouse)

const houseInfo = computed(() => {
  const { buildAge, layout } = basic.value
  const { build } = pin.value
  // const addonData = {
  //   room: addon.room ? ` ${addon.room} 房 (室)` : '',
  //   living: addon.living ? ` ${addon.living} 廳` : '',
  //   bath: addon.bath ? ` ${addon.bath} 衛` : '',
  // }

  return [
    {
      id: 'pinBuild',
      label: '建坪',
      value: build,
      suffix: '坪',
    },
    {
      id: 'buildAge',
      label: '屋齡',
      value: buildAge,
      suffix: '年',
    },
    {
      id: 'floor',
      label: '樓層',
      value: onFloorText(floor.value),
    },
    {
      id: 'layout',
      label: '格局',
      value: onLayoutText(layout),
    },
  ]
})
</script>

<template>
  <ul class="tm:space-y-[10px] p:grid p:grid-cols-2 p:gap-y-[10px]">
    <li
      class="flex items-center gap-x-[15px] text-[14px] text-[--gray-999]"
      v-for="(item, index) in houseInfo"
      :key="`${item.id}_${index}`"
    >
      <span class="min-w-[30px]">
        {{ item.label }}
      </span>
      <p class="text-[16px]">
        <span class="text-[--gray-333]">{{ item.value }}</span>
        <template v-if="item.suffix">&nbsp;{{ item.suffix }}</template>
      </p>
    </li>
  </ul>
</template>
