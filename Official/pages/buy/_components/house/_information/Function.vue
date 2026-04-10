<script setup>
import Container from '@pages/buy/_components/house/_information/_Container.vue'

import { useBuyHouseStore } from '@stores/buy/house.js'

const buyHouse = useBuyHouseStore()
const { poi } = storeToRefs(buyHouse)

const items = computed(() => {
  const { traffic, schools } = poi.value
  const hasTraffic = traffic && traffic.length !== 0
  const hasSchools = schools && schools.length !== 0
  const onValues = (hasValuse, values) => {
    const result = []

    if (hasValuse) {
      for (let i = 0; i < values.length; i += 1) {
        const { name, walkMin } = values[i]

        result.push({
          content: name,
          tools: {
            icon: 'icon_walk',
            content: `${walkMin} mins`,
            class: {
              main: 'text-[14px] text-[--gray-666]',
              icon: 'tm:h-[16px] tm:w-[16px] p:h-[18px] p:w-[18px]',
            },
          },
        })
      }
    }

    return result
  }

  console.log(`hasTraffic: ${hasTraffic}`)
  console.log(`hasSchools: ${hasSchools}`)

  return [
    [
      {
        id: 'function',
        label: '交通機能',
        values: onValues(hasTraffic, traffic),
      },
    ],
    [
      {
        id: 'school',
        label: '附近國中小',
        values: onValues(hasSchools, schools),
      },
    ],
  ]
})
</script>

<template>
  <Container name="function" :items="items" />
</template>

<style></style>
