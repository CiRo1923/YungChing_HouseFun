<script setup>
import { numberComma } from '@js/_prototype.js'
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const items = computed(() => {
  return [
    {
      value: numberComma.add(props.item.price),
      unit: '萬',
      note: props.item.priceNote,
    },
    {
      value: numberComma.add(props.item.unitPrice),
      unit: '萬 / 坪',
      note: props.item.unitPriceNote,
    },
    {
      value: numberComma.add(props.item.areaPin),
      unit: '坪',
      note: props.item.areaPinNote,
    },
  ]
})
</script>

<template>
  <div class="m:mx-[15px] pt:flex pt:shrink-0 pt:flex-col pt:justify-center">
    <ul class="flex t:w-[300px] t:gap-x-[10px] p:w-[340px] p:gap-x-[20px]">
      <li class="flex-1" v-for="(data, index) in items" :key="`${data.value}_${index}`">
        <p class="text-[12px] text-[--gray-666]">
          <b class="text-[18px] text-[--red-e56a]">{{ data.value }}</b>
          {{ data.unit }}
        </p>
        <small class="block text-[12px] text-[--gray-999]" v-if="data.note">
          {{ data.note }}
        </small>
      </li>
    </ul>
  </div>
</template>

<style lang="postcss"></style>
