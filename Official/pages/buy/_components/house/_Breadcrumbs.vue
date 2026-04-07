<script setup>
import { useHouseStore } from '@stores/buy/house.js'

const house = useHouseStore()
const route = useRoute()
const { basic } = storeToRefs(house)

const items = computed(() => {
  const { params } = route
  const { county, district } = basic.value || {}

  return [
    {
      label: '買屋',
    },
    {
      label: '區域找房',
    },
    {
      label: county,
    },
    {
      label: district,
    },
    {
      label: params.hfid,
    },
  ]
})
</script>

<template>
  <ol class="breadcrumbs flex items-center">
    <!-- <li>首頁</li> -->
    <li
      class="breadcrumbs-item flex items-center text-[14px]"
      v-for="(item, index) in items"
      :key="`${item.label}_${index}`"
    >
      {{ item.label }}
    </li>
  </ol>
</template>

<style lang="postcss">
.breadcrumbs-item {
  &:not(:first-child) {
    &::before {
      background-image: url(@imgs/common/breadcrumbs_arrow.svg);

      @apply mx-[10px] h-[10px] w-[6px] bg-cover bg-center bg-no-repeat content-default;
    }
  }
}
</style>
