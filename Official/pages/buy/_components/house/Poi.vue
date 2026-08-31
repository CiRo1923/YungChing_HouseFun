<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyHouse = useBuyHouseStore()
const { lifeMap, poi } = storeToRefs(buyHouse)

const categoryOptions = [
  {
    id: 'traffic',
    label: '交通',
    icon: 'icon_traffic',
  },
  {
    id: 'schools',
    label: '學校',
    icon: 'icon_school',
  },
  {
    id: 'medical',
    label: '醫療',
    icon: 'icon_medical',
  },
  {
    id: 'dining',
    label: '餐飲',
    icon: 'icon_dining',
  },
  {
    id: 'shopping',
    label: '購物',
    icon: 'icon_shopping',
  },
  {
    id: 'living',
    label: '生活',
    icon: 'icon_living',
  },
  {
    id: 'parks',
    label: '公園',
    icon: 'icon_parks',
  },
  {
    id: 'parking',
    label: '停車',
    icon: 'icon_parking',
  },
]

const googleMapRef = ref(null)
const activeID = ref(null)
const anchorIndex = ref(null)

// 點擊右側清單項目時,觸發地圖上對應 POI 的點擊行為(開啟 InfoWindow)
const onGoogleMapFocusPlace = (index) => {
  googleMapRef.value?.onFocusPlace(index)
}
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
      <PageBuyHousePoiSwiperButton
        :items="items"
        v-model:activeID="activeID"
        v-model:anchorIndex="anchorIndex"
        v-if="!isDeviceM"
      />
      <div class="relative p:pr-[400px]">
        <PageBuyHousePoiGoogleMap
          ref="googleMapRef"
          :items="items"
          :activeID="activeID"
          :source="source"
        />
        <PageBuyHousePoiSwiperButton
          :items="items"
          v-model:activeID="activeID"
          v-model:anchorIndex="anchorIndex"
          v-if="isDeviceM"
        />
        <PageBuyHousePoiItemsAnchor
          :items="items"
          :activeID="activeID"
          v-model:anchorIndex="anchorIndex"
          @focusPlace="onGoogleMapFocusPlace"
        />
      </div>
    </div>
  </PageBuyHouseContent>
</template>
