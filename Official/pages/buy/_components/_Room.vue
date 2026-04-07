<script setup>
import FormSelectDropdown from '@components/buy/mForm/SelectDropdown.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'
import FormInput from '@components/buy/mForm/Input.vue'

import { useHomeStore } from '@stores/buy/home.js'
// import useProjectStores from '@stores/buy/_composables/useProjectStores.js'

const home = useHomeStore()
const { room } = storeToRefs(home)
// const { onValueGetText } = useProjectStores()
const route = useRoute()

// const emits = defineEmits(['change'])
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})
const selectDropdownRef = ref(null)
const minRoom = ref(null)
const maxRoom = ref(null)
const model = ref([])

const onInputBlur = () => {
  const hasRoom = maxRoom.value || minRoom.value
  const max = Number(maxRoom.value)
  const min = Number(minRoom.value)
  const isSame = max && min && max === min

  if (hasRoom) {
    model.value = [null]
  } else {
    model.value = []
  }

  if (max && min && max < min) {
    minRoom.value = max
    maxRoom.value = min
  }

  if (isSame) {
    room.value.label = `${maxRoom.value} 房`
    room.value.query = maxRoom.value
  }

  if (minRoom.value && maxRoom.value) {
    room.value.label = `${minRoom.value} - ${maxRoom.value} 房`
    room.value.query = `${minRoom.value}-${maxRoom.value}`
  } else if (minRoom.value) {
    room.value.label = `${minRoom.value} 房以上`
    room.value.query = `${minRoom.value}-`
  } else if (maxRoom.value) {
    room.value.label = `${maxRoom.value} 房以下`
    room.value.query = `-${maxRoom.value}`
  }
}

const onChange = (data) => {
  const { value } = data

  if (model.value.length === 0) {
    room.value.label = `格局${room.value.options[0].label}`
    room.value.query = ''
    minRoom.value = null
    maxRoom.value = null
    return
  }

  const min = model.value[0]
  const max = model.value[model.value.length - 1]
  const range = room.value.options
    .filter((item) => typeof item.value === 'number' && item.value >= min && item.value <= max)
    .map((item) => item.value)

  const hasClickedValue = model.value.includes(value)
  let nextModel = range

  if (!hasClickedValue && range.length > 1) {
    const middle = (min + max) / 2
    nextModel =
      value >= middle
        ? range.filter((item) => item <= value)
        : range.filter((item) => item >= value)
  }

  model.value = nextModel

  const nextMin = nextModel[0]
  const nextMax = nextModel[nextModel.length - 1]
  const isSame = nextMin === nextMax

  room.value.label = isSame
    ? room.value.options.find((item) => item.value === nextMax)?.label || String(nextMax)
    : `${nextMin} - ${nextMax} 房`
  room.value.query = isSame ? nextMax : `${nextMin}-${nextMax}`

  minRoom.value = null
  maxRoom.value = null
}

const onInit = () => {
  const queryRoom = route.query.room
  const roomArray = queryRoom ? queryRoom.split('-') : null
  const roomLabel = roomArray ? `${roomArray[0]} - ${roomArray[1]}` : null

  room.value.label = queryRoom ? `${roomLabel} 房` : room.value.defaultLabel
  model.value = queryRoom
    ? Array.from(
        { length: Number(roomArray[1]) - Number(roomArray[0]) + 1 },
        (_, i) => Number(roomArray[0]) + i
      )
    : model.value
}

onInit()
</script>

<template>
  <FormSelectDropdown
    :name="`${props.name}Dropdown`"
    v-model="room.label"
    :setClass="{
      main: 'p:--px-12 m:--h-50 pt:--h-45 tm:--px-10 pt:--border pt:--rounded --py-5 w-full',
      dropdown: 'pt:--rounded m:w-full',
      dropdownContainer: 'm:px-[30px] m:py-[20px] pt:p-[20px] p:min-w-[170px]',
    }"
    ref="selectDropdownRef"
  >
    <ul class="space-y-[15px]">
      <li v-for="(item, index) in room.options" :key="`${props.name}_${item.code}_${index}`">
        <FormCheckBox
          :name="props.name"
          v-model="model"
          :config="{
            label: item.label,
            value: item.value,
            valueClickClear: '',
            sort: 'asc',
          }"
          @change="onChange"
        />
      </li>
      <li class="flex items-center gap-x-[10px]">
        <FormInput
          name="minRoom"
          v-model="minRoom"
          :config="{
            inputMode: 'numeric',
            maxlength: 2,
            inputChinese: false,
            isExistClose: false,
            integer: true,
            checkNotIsZero: true,
          }"
          :setClass="{
            main: '--h-35 --px-12 --py-5 --border --rounded p:w-[55px]',
          }"
          @blur="onInputBlur"
        />
        <span>-</span>
        <FormInput
          name="maxRoom"
          v-model="maxRoom"
          :config="{
            inputMode: 'numeric',
            maxlength: 2,
            inputChinese: false,
            isExistClose: false,
            integer: true,
            checkNotIsZero: true,
          }"
          :setClass="{
            main: '--h-35 --px-12 --py-5 --border --rounded p:w-[55px]',
          }"
          @blur="onInputBlur"
        />
        <span>房</span>
      </li>
      <li>
        <FormCheckBox
          :name="`${props.name}_agree`"
          v-model="room.hasAddon"
          :config="{
            mode: 'boolean',
            label: '房數不含加蓋',
          }"
        />
      </li>
    </ul>
  </FormSelectDropdown>
</template>

<style></style>
