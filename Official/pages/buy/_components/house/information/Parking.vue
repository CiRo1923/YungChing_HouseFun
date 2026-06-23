<script setup>
const buyHouse = useBuyHouseStore()
const { parking } = storeToRefs(buyHouse)
const hasParking = computed(() => parking.value?.length !== 0)

const items = computed(() => {
  const result = []

  if (hasParking.value) {
    for (let i = 0; i < parking.value.length; i += 1) {
      const { mode, amount, reg, type, expense, payPeriod } = parking.value[i]
      const parkingMode = () => {
        const modeResult = []
        if (amount) modeResult.push(`${amount} 個`)
        if (reg) modeResult.push(reg)
        if (mode) modeResult.push(mode)

        return modeResult
      }

      result.push({
        id: 'parkingName',
        label: `車位 ${i + 1}`,
        items: [
          [
            {
              id: 'parkingType',
              label: '類型',
              values: [
                {
                  content: type,
                },
              ],
              isHidden: !type,
            },
            {
              id: 'parkingMode',
              label: '說明',
              values: [
                {
                  content: parkingMode().join('、'),
                },
              ],
            },
            {
              id: 'parkingFee',
              label: '管理費',
              values: [
                {
                  content: payPeriod ? `${expense} / ${payPeriod}` : '',
                },
              ],
              isHidden: !payPeriod,
            },
          ],
        ],
      })
    }
  }

  return result
})
</script>

<template>
  <!-- <pre>
    {{ parking }}
  </pre> -->

  <ul
    class="m:space-y-[20px] t:gap-x-[40px] t:gap-y-[25px] tm:px-[15px] pt:flex p:gap-x-[80px] p:gap-y-[50px] p:px-[30px]"
    v-if="hasParking"
  >
    <li
      class="m:space-y-[10px] pt:flex"
      v-for="(item, index) in items"
      :key="`${item.label}_${index}`"
    >
      <span
        class="flex items-center justify-center bg-[--gray-f7] m:h-[30px] p:w-[70px] p:text-[16px]"
      >
        {{ item.label }}
      </span>
      <PageBuyHouseInformationContainer name="parking" :items="item.items" />
    </li>
  </ul>
</template>

<style></style>
