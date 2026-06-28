<script setup>
const buyHouse = useBuyHouseStore()
const { community } = storeToRefs(buyHouse)

const items = computed(() => {
  const { buildType, stats, areaMin, areaMax } = community.value
  const area = [areaMin, areaMax].filter(Boolean)
  const areaMinMax = area.length ? `${area.join(' ~ ')} 坪` : null

  return [
    {
      id: 'buildType',
      value: buildType,
    },
    {
      id: 'households',
      value: `${stats.households} 戶`,
      isHidden: !stats.households,
    },
    {
      id: 'areaMinMax',
      value: areaMinMax,
      isHidden: !areaMinMax,
    },
    {
      id: 'link',
      value: '社區詳情資訊',
    },
  ]
})
</script>

<template>
  <BuyMSeparator
    :items="items"
    :setClass="{
      main: '--horizontal --gap-x-16',
      item: 'text-[14px]',
    }"
  >
    <template #link="{ value }">
      <BuyMAnchor
        :text="value"
        :config="{
          icon: 'chevron_right',
        }"
        :setClass="{
          main: '--text-green-6a2d',
          icon: 'h-[18px] w-[18px] p-[2px]',
        }"
      />
    </template>
  </BuyMSeparator>
</template>

<style lang="postcss"></style>
