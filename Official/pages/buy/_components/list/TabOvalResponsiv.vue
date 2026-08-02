<script setup>
const buyList = useBuyListStore()
const { region, mrt } = storeToRefs(buyList)
const buyProject = useBuyProjectStore()
const { isChannelRegion, isChannelMrt, commonParams } = useBuyListActions()

const paramsRegion = computed(() => {
  const { ids } = region.value

  return ids ? [`${ids}_region`] : []
})

const paramsMrt = computed(() => {
  const { ids } = mrt.value

  return ids ? [`${ids}_mrt`] : []
})

// 基礎項(id / label / icon)由 store 提供;依 id 補上對應的路由 to(map 無 to)
const items = computed(() =>
  buyProject.channelTabs.map((item) => {
    const params =
      item.id === 'region' ? paramsRegion.value : item.id === 'mrt' ? paramsMrt.value : null

    if (!params) return { ...item }

    return {
      ...item,
      to: {
        name: buyList.basicRouteName,
        params: {
          filters: [...params, ...commonParams.value],
        },
        query: {
          pg: 1,
        },
      },
    }
  })
)

const active = computed(() => {
  if (isChannelRegion.value) return 0
  if (isChannelMrt.value) return 1

  return 2
})
</script>

<template>
  <CommonMTabOvalResponsiv
    :items="items"
    :config="{
      active: active,
      containerMode: false,
    }"
    :setClass="{
      main: '--anchor-h-50 --anchor-px-10 --anchor-py-8 --green-8b0d mx-auto p:max-w-[1200px]',
      headerItem: 'm:flex-1',
      anchor: 'text-[16px] m:w-full p:w-[160px]',
    }"
  />
</template>

<style lang="postcss"></style>
