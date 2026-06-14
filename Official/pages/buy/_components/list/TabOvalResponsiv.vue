<script setup>
const buyList = useBuyListStore()
const { region, mrt } = storeToRefs(buyList)
const { isChannelRegion, isChannelMrt, commonParams } = useBuyListActions()

const paramsRegion = computed(() => {
  const { ids } = region.value

  return ids ? [`${ids}_region`] : []
})

const paramsMrt = computed(() => {
  const { ids } = mrt.value

  return ids ? [`${ids}_mrt`] : []
})

const items = computed(() => [
  {
    id: 'region',
    label: '區域找房',
    icon: 'icon_loaction',
    to: {
      name: buyList.basicRouteName,
      params: {
        filters: [...paramsRegion.value, ...commonParams.value],
      },
      query: {
        pg: 1,
      },
    },
  },
  {
    id: 'mrt',
    label: '捷運找房',
    icon: 'icon_mrt',
    to: {
      name: buyList.basicRouteName,
      params: {
        filters: [...paramsMrt.value, ...commonParams.value],
      },
      query: {
        pg: 1,
      },
    },
  },
  {
    id: 'map',
    label: '地圖找房',
    icon: 'icon_map',
  },
])

const active = computed(() => {
  if (isChannelRegion.value) return 0
  if (isChannelMrt.value) return 1

  return 2
})
</script>

<template>
  <BuyMTabOvalResponsiv
    :items="items"
    :config="{
      active: active,
      containerMode: false,
    }"
    :setClass="{
      main: '--anchor-height-50 --green-8b0d mx-auto p:max-w-[1200px]',
      headerItem: 'm:flex-1',
      anchor: 'm:w-full p:w-[160px]',
    }"
  />
</template>

<style lang="postcss"></style>
