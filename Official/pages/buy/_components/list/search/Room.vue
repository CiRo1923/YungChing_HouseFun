<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { apiSearchData, room } = storeToRefs(buyList)
const { onResolveByDevice } = useBuyProjectActions()
const componentsName = 'Room'

const onChange = (data) => {
  const { value } = data

  if (room.value.range.length === 0) {
    room.value.label = room.value.defaultLabel
    apiSearchData.value.room = ''
    room.value.min = null
    room.value.max = null
    return
  }

  const min = room.value.range[0]
  const max = room.value.range[room.value.range.length - 1]
  const range = room.value.options
    .filter((item) => typeof item.value === 'number' && item.value >= min && item.value <= max)
    .map((item) => item.value)

  const hasClickedValue = room.value.range.includes(value)
  let nextModel = range

  if (!hasClickedValue && range.length > 1) {
    const middle = (min + max) / 2
    nextModel =
      value >= middle
        ? range.filter((item) => item <= value)
        : range.filter((item) => item >= value)
  }

  room.value.range = nextModel

  const nextMin = nextModel[0]
  const nextMax = nextModel[nextModel.length - 1]
  const isSame = nextMin === nextMax

  room.value.label = isSame
    ? room.value.options.find((item) => item.value === nextMax)?.label || String(nextMax)
    : `${nextMin} - ${nextMax} ${room.value.unit}`
  apiSearchData.value.room = isSame ? nextMax : `${nextMin}-${nextMax}`

  room.value.min = null
  room.value.max = null
}

const onInit = () => {
  const roomArray = apiSearchData.value.room ? apiSearchData.value.room.split('-') : null
  const roomLabel = roomArray ? `${roomArray[0]} - ${roomArray[1]}` : null

  room.value.label = apiSearchData.value.room
    ? `${roomLabel} ${room.value.unit}`
    : onResolveByDevice(room.value.defaultLabel, device.value)
  room.value.range = apiSearchData.value.room
    ? Array.from(
        { length: Number(roomArray[1]) - Number(roomArray[0]) + 1 },
        (_, i) => Number(roomArray[0]) + i
      )
    : room.value.range
}

onResize()
onInit()

onMounted(() => {
  window.addEventListener('resize', () => {
    onResize()
    onInit()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    onResize()
    onInit()
  })
})
</script>

<template>
  <BuyMFormSelectDropdown
    :name="`${componentsName}Dropdown`"
    v-model="room.label"
    :config="{
      target: {
        m: '.search-mode',
      },
      isDropdwonFull: {
        m: true,
      },
    }"
    :setClass="{
      main: '--rounded p:--py-10 p:--px-12 m:--h-40 pt:--h-45 tm:--py-8 tm:--px-8 w-full',
      type: 'tm:text-[14px] p:text-[16px]',
      dropdown: 'pt:--rounded --py-20 pt:--px-20 m:--px-30 m:w-full',
      dropdownContainer: 'p:w-[220px]',
    }"
  >
    <ul class="space-y-[15px]">
      <li v-for="(item, index) in room.options" :key="`${componentsName}_${item.code}_${index}`">
        <BuyMFormCheckBox
          :name="componentsName"
          v-model="room.range"
          :config="{
            label: item.label,
            value: item.value,
            valueClickClear: '',
            sort: 'asc',
          }"
          @change="onChange"
        />
      </li>
      <li>
        <PageBuyListSearchMaxMinRange
          name="room"
          :data="room"
          v-model:min="room.min"
          v-model:max="room.max"
          :config="{
            placeholder: {
              min: '最少',
              max: '最多',
            },
            schema: {
              api: 'room',
            },
            suffix: room.unit,
          }"
        />
      </li>
      <li>
        <BuyMFormCheckBox
          :name="`${componentsName}_agree`"
          v-model="apiSearchData.addRoom"
          :config="{
            mode: 'boolean',
            label: '房數不含加蓋',
          }"
        />
      </li>
    </ul>
  </BuyMFormSelectDropdown>
</template>

<style></style>
