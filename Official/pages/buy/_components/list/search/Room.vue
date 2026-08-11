<script setup>
import { onResolveByDevice } from '@js/_projectPrototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { apiSearchData, room } = storeToRefs(buyList)
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
  const roomValue = apiSearchData.value.room

  // 無選取 → 預設 label,range 維持原值
  if (!roomValue && roomValue !== 0) {
    room.value.label = onResolveByDevice(room.value.defaultLabel, device.value)
    return
  }

  // roomValue 可能為單一值(如 "3")或範圍(如 "1-3");單選時 roomArray[1] 為 undefined
  const roomArray = String(roomValue).split('-')
  const min = Number(roomArray[0])
  const max = roomArray[1] != null && roomArray[1] !== '' ? Number(roomArray[1]) : min
  const isSame = min === max

  // 單選:用選項 label(含「房」),避免「N - undefined 房」;範圍:min - max
  room.value.label = isSame
    ? room.value.options.find((item) => item.value === max)?.label || String(max)
    : `${min} - ${max} ${room.value.unit}`

  // 單選時 range = [value],確保勾選狀態正確(再次開啟不會顯示為不限)
  room.value.range = Array.from({ length: max - min + 1 }, (_, i) => min + i)
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
  <CommonMFormSelectDropdown
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
        <CommonMFormCheckBox
          :name="componentsName"
          v-model="room.range"
          :config="{
            label: item.label,
            value: item.value,
            valueClickClear: '',
            sort: 'asc',
          }"
          :setClass="{
            main: '--icon-size-20 --checkbox-green-8d0d',
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
        <CommonMFormCheckBox
          :name="`${componentsName}_agree`"
          v-model="apiSearchData.addRoom"
          :config="{
            mode: 'boolean',
            label: '房數不含加蓋',
          }"
          :setClass="{
            main: '--icon-size-20 --checkbox-green-8d0d',
          }"
        />
      </li>
    </ul>
  </CommonMFormSelectDropdown>
</template>

<style></style>
