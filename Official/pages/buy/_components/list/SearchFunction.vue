<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onValueGetText, onResolveByDevice } = useBuyProjectActions()
const buyList = useBuyListStore()
const { apiSearchData, price, type, pin, parking, age, floor, unitPrice, face, nearBy, more } =
  storeToRefs(buyList)
const { isChannelRegion, isChannelMrt } = useBuyListActions()

// const route = useRoute()

const emits = defineEmits(['apiSearch', 'routerPush'])

const isDeviceM = computed(() => device.value === 'm')

const onApiSearch = () => {
  emits('apiSearch')
}

const onRouterPush = async () => {
  emits('routerPush')
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
  <div
    class="search-funciton mx-auto m:border-b-[1px] m:border-b-[--gray-e5] m:py-[10px] tm:px-[10px] p:max-w-[1200px]"
  >
    <div class="search-mode t:py-[15px] p:space-y-[15px] p:py-[25px]">
      <ul class="search-mode-content relative flex flex-wrap gap-x-[5px] gap-y-[10px] p:grow">
        <li class="search-mode-item relative tm:w-[100px] p:w-[155px] p:shrink-0">
          <PageBuyListSearchRegion @click:routePush="onRouterPush" v-if="isChannelRegion" />
          <PageBuyListSearchMrt
            name="mrt"
            :config="{
              areaAxis: {
                m: 'x',
              },
            }"
            v-if="isChannelMrt"
          />
        </li>
        <li class="search-mode-item relative tm:flex-1 p:w-[155px] p:shrink-0">
          <PageBuyListSearchPurpose @click:routePush="onRouterPush" />
        </li>
        <li class="search-mode-item relative tm:flex-1 p:w-[155px] p:shrink-0">
          <PageBuyListSearchPrice @click:routePush="onRouterPush" />
        </li>
        <li class="search-mode-item relative tm:flex-1 p:w-[155px] p:shrink-0" v-if="!isDeviceM">
          <PageBuyListSearchRoom />
        </li>
        <li class="search-mode-item relative tm:flex-1 p:w-[155px] p:shrink-0">
          <PageBuyListSearchMore @click:routePush="onRouterPush" />
        </li>
        <li
          class="search-mode-item relative flex min-w-0 items-center gap-x-[5px] overflow-hidden tm:w-full p:grow"
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
              main: '--bg-orange-e646 --text-white --oval p:--h-45 tm:--px-10 p:--px-20 tm:--h-40 shrink-0 gap-x-[3px]',
              icon: 'h-[16px] w-[16px]',
            }"
            @click="onRouterPush"
            v-if="!isDeviceM"
          />
        </li>
      </ul>
      <PageBuyListSearchCondition />
    </div>
    <PageBuyListSearchFilter @click="onApiSearch" v-if="isDeviceM" />
  </div>
</template>

<style lang="postcss"></style>
