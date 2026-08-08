<script setup>
import { onToFixed } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

// purposeID → 7: 車位(坪數標籤為車坪)、8: 土地(坪數標籤為地坪、不顯示主建 / 有車位),其餘用途走一般格式
const PURPOSE_ID_PARKING = 7
const PURPOSE_ID_LAND = 8

const pinInfo = computed(() => {
  const { purposeID, pin, hasParking } = props.item
  const { build, main, balcony } = pin
  const isParking = Number(purposeID) === PURPOSE_ID_PARKING
  const isLand = Number(purposeID) === PURPOSE_ID_LAND
  // 「主 + 陽」→「主建」、「建坪」→「總建」(土地 / 車位 仍為 地坪 / 車坪)
  const mainBalconyText = main && balcony ? `主建 ${onToFixed([main, balcony])} 坪` : null
  const pinBuildLabel =
    { [PURPOSE_ID_PARKING]: '車坪', [PURPOSE_ID_LAND]: '地坪' }[Number(purposeID)] ?? '總建'
  const pinBuildText = build != null ? `${pinBuildLabel} ${build} 坪` : null

  return [
    {
      id: 'pinBuild',
      label: '總建',
      value: pinBuildText,
      isHidden: !pinBuildText,
    },
    {
      id: 'pinMainBalcony',
      label: '主建',
      value: mainBalconyText,
      isHidden: isLand || !mainBalconyText,
    },
    {
      id: 'hasParking',
      label: '有車位',
      value: '有車位',
      isHidden: isLand || isParking || !hasParking,
    },
  ]
})
</script>

<template>
  <CommonMSeparator
    :items="pinInfo"
    :setClass="{
      main: '--horizontal p:--gap-x-20 tm:--gap-x-12',
    }"
  />
</template>

<style lang="postcss"></style>
