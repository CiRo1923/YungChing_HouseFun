<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyHouse = useBuyHouseStore()
const { lifeMap, poi } = storeToRefs(buyHouse)

const categoryOptions = [
  { id: 'traffic', label: '交通' },
  { id: 'schools', label: '學校' },
  { id: 'medical', label: '醫療' },
  { id: 'dining', label: '餐飲' },
  { id: 'shopping', label: '購物' },
  { id: 'living', label: '生活' },
  { id: 'parks', label: '公園' },
  { id: 'parking', label: '停車' },
]

const activeID = ref(null)
const isDeviceM = computed(() => device.value === 'm')
const hasPoi = computed(() => items.value.some((item) => item.data.length > 0))
const items = computed(() =>
  categoryOptions.map((item) => ({
    ...item,
    data: Array.isArray(source.value?.[item.id]) ? source.value[item.id] : [],
  }))
)
const source = computed(() => {
  const mapData = lifeMap.value ?? {}
  const detailPoi = poi.value ?? {}
  const hasLifeMap = categoryOptions.some((item) => Array.isArray(mapData[item.id]))

  return hasLifeMap ? mapData : detailPoi
})

watch(
  items,
  (value) => {
    if (value.some((item) => item.id === activeID.value && item.data.length > 0)) return

    activeID.value = value.find((item) => item.data.length > 0)?.id ?? value[0]?.id ?? null
  },
  {
    immediate: true,
  }
)

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <PageBuyHouseContent
    v-if="hasPoi"
    title="生活地圖"
    :setClass="{
      main: 'relative',
    }"
  >
    <div class="overflow-hidden pt:rounded-[10px]">
      <PageBuyHousePoiSwiperButton :items="items" v-model:activeID="activeID" v-if="!isDeviceM" />
      <div class="relative tm:h-[380px] p:h-[420px] p:pr-[300px]">
        <PageBuyHousePoiGoogleMap :items="items" :activeID="activeID" :source="source" />
        <PageBuyHousePoiItemsAnchor :items="items" :activeID="activeID" />
      </div>
      <PageBuyHousePoiSwiperButton :items="items" v-model:activeID="activeID" v-if="isDeviceM" />
    </div>
  </PageBuyHouseContent>
</template>

<style lang="postcss"></style>
