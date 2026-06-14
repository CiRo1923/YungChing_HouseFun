<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onValueGetText, onResolveByDevice } = useBuyProjectActions()
const buyList = useBuyListStore()
const {
  apiSearchData,
  region,
  mrt,
  price,
  type,
  pin,
  parking,
  age,
  floor,
  unitPrice,
  face,
  nearBy,
  more,
} = storeToRefs(buyList)
const { isChannelRegion, isChannelMrt, commonParams } = useBuyListActions()

// const route = useRoute()
const router = useRouter()

const isDeviceM = computed(() => device.value === 'm')
const paramsRegion = computed(() => {
  const { ids } = region.value

  return ids ? [`${ids}_region`] : []
})

const paramsMrt = computed(() => {
  const { ids } = mrt.value

  return ids ? [`${ids}_mrt`] : []
})

const paramsChannel = computed(() =>
  isChannelRegion.value ? paramsRegion.value : isChannelMrt.value ? paramsMrt.value : []
)

const onSearch = async () => {
  console.log(commonParams.value)

  await router.push({
    name: buyList.basicRouteName,
    params: {
      filters: [...paramsChannel.value, ...commonParams.value],
    },
    query: {
      pg: 1,
    },
  })
}

const onInit = () => {
  const onLable = (name, data, options) => {
    const isOptionsString = options && typeof options === 'string'

    if (apiSearchData.value[name] && isOptionsString)
      return onValueGetText(options, apiSearchData.value[name].split(','))
    if (apiSearchData.value[name] && !isOptionsString) {
      const value = apiSearchData.value[name]
      const noMatch = !data.options.find((item) => item.value === value)

      if (noMatch) {
        const min = value.split('-')[0]
        const max = value.split('-')[1]

        const isSame = !!(max && min && max === min)

        if (isSame) return `${min} ${data.unit}`

        if (max && min) {
          return `${min} - ${max} ${data.unit}`
        } else if (min) {
          return `${min} ${data.unit}以上`
        } else if (max) {
          return `${max} ${data.unit}以下`
        }
      }

      return `${apiSearchData.value[name]} ${data.unit}`
    }

    return onResolveByDevice(data.defaultLabel, device.value)
  }
  const onMinMax = (name, data) => {
    const value = apiSearchData.value[name]
    const noMatch = !data.options.find((item) => item.value === value)

    if (value && noMatch) {
      const min = value.split('-')[0]
      const max = value.split('-')[1]

      if (min) data.min = min
      if (max) data.max = max
    }
  }

  more.value.label = onResolveByDevice(more.value.defaultLabel, device.value)

  price.value.label = onLable('price', price.value)
  type.value.label = onLable('type', type.value, 'caseType')
  pin.value.label = onLable(pin.value.type, pin.value)
  onMinMax(pin.value.type, pin.value)
  parking.value.label = onLable('parking', parking.value, 'parkingMode')
  age.value.label = onLable('age', age.value)
  onMinMax('age', age.value)
  floor.value.label = onLable('floor', floor.value)
  onMinMax('floor', floor.value)
  unitPrice.value.label = onLable('uniprice', unitPrice.value)
  onMinMax('uniprice', unitPrice.value)
  face.value.label = onLable('dt', face.value, 'face')
  nearBy.value.label = onLable('ft', nearBy.value, 'nearBy')
}

onResize()
onInit()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="search-funciton mx-auto p:max-w-[1200px]">
    <div class="search-mode tm:py-[15px] p:space-y-[15px] p:py-[25px]">
      <ul
        class="search-mode-content relative flex flex-wrap gap-x-[5px] gap-y-[10px] m:px-[10px] pt:grow"
      >
        <li class="search-mode-item relative tm:w-[100px] pt:shrink-0 p:w-[155px]">
          <PageBuyListSearchRegion name="region" v-if="isChannelRegion" />
          <PageBuyListSearchMrt name="mrt" v-if="isChannelMrt" />
        </li>
        <li class="search-mode-item relative m:flex-1 pt:shrink-0 p:w-[155px]">
          <PageBuyListSearchPurpose name="purpose" />
        </li>
        <li class="search-mode-item relative m:flex-1 pt:shrink-0 p:w-[155px]">
          <PageBuyListSearchPrice name="price" />
        </li>
        <li class="search-mode-item relative m:flex-1 pt:shrink-0 p:w-[155px]" v-if="!isDeviceM">
          <PageBuyListSearchRoom name="room" />
        </li>
        <li class="search-mode-item relative m:flex-1 pt:shrink-0 p:w-[155px]">
          <PageBuyListSearchMore />
        </li>
        <li
          class="search-mode-item relative flex items-center gap-x-[5px] overflow-hidden m:w-full pt:grow"
        >
          <PageBuyListSearchKeyword />
          <BuyMAnchor
            text="搜尋"
            :config="{
              icon: {
                name: 'icon_search',
                position: 'left',
              },
            }"
            :setClass="{
              main: '--bg-orange-e646 --text-white --oval pt:--h-45 tm:--px-10 p:--px-20 m:--h-40 shrink-0',
              icon: 'h-[16px] w-[16px]',
            }"
            @click="onSearch"
          />
        </li>
      </ul>
      <PageBuyListSearchCondition />
    </div>
  </div>
</template>

<style lang="postcss"></style>
