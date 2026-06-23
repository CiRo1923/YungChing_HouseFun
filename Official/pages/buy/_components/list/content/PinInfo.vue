<script setup>
import { onToFixed } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const pinInfo = computed(() => {
  const { purpose, pin, parking } = props.item
  const { build, main, balcony } = pin
  const { type } = parking
  const mainBalconyText = main && balcony ? `主 + 陽 ${onToFixed([main, balcony])} 坪` : null
  const pinLabel = { 土地: '地坪', 車位: '車坪' }[purpose] ?? '建坪'
  const pinBuildText = `${pinLabel} ${build} 坪`

  return [
    {
      id: 'pinBuild',
      label: '建坪',
      value: pinBuildText,
    },
    {
      id: 'pinMainBalcony',
      label: '主陽',
      value: mainBalconyText,
      isHidden: !mainBalconyText,
    },
    {
      id: 'parkingType',
      label: '停車方式',
      value: type,
      isHidden: !type,
    },
  ]
})
</script>

<template>
  <BuyMSeparator
    :items="pinInfo"
    :setClass="{
      main: '--horizontal p:--gap-x-20 tm:--gap-x-12',
    }"
  />
</template>

<style lang="postcss"></style>
