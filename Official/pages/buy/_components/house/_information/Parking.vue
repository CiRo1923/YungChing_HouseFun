<script setup>
import Container from '@pages/buy/_components/house/_information/_Container.vue'

import { useBuyHouseStore } from '@stores/buy/house.js'

const buyHouse = useBuyHouseStore()
const { parking } = storeToRefs(buyHouse)
const hasParking = computed(() => parking.value && parking.value.length !== 0)

const items = computed(() => {
  const result = []

  if (hasParking.value) {
    for (let i = 0; i < parking.value.length; i += 1) {
      const { mode, reg, type, expense, payPeriod } = parking.value[i]
      const parkingMode = () => {
        const modeResult = []
        if (reg) modeResult.push(reg)
        if (mode) modeResult.push(mode)

        return modeResult
      }

      result.push([
        {
          id: 'parkingName',
          label: `車位 ${i + 1}`,
          values: null,
        },
        {
          id: 'parkingType',
          label: '車位類型',
          values: [
            {
              content: type,
            },
          ],
        },
        {
          id: 'parkingMode',
          label: '停車方式',
          values: [
            {
              content: parkingMode().join('、'),
            },
          ],
        },
        {
          id: 'parkingFee',
          label: '車位管理費',
          values: [
            {
              content: payPeriod ? `${expense} / ${payPeriod}` : '',
            },
          ],
        },
      ])
    }
  }

  return result
})
</script>

<template>
  <!-- <pre>
    {{ parking }}
  </pre> -->
  <Container name="parking" :items="items" v-if="hasParking" />
</template>

<style></style>
