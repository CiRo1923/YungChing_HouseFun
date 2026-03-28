<script setup>
import FormSelectDropdown from '@components/buy/mForm/SelectDropdown.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'
import FormInput from '@components/buy/mForm/Input.vue'

import { useHomeStore } from '@stores/buy/home.js'

const home = useHomeStore()
const { room } = storeToRefs(home)

const emits = defineEmits(['change'])
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
    room.value.value = maxRoom.value
  }

  if (minRoom.value && maxRoom.value) {
    room.value.label = `${minRoom.value} - ${maxRoom.value} 房`
    room.value.value = `${minRoom.value}-${maxRoom.value}`
  } else if (minRoom.value) {
    room.value.label = `${minRoom.value} 房以上`
    room.value.value = `${minRoom.value}-`
  } else if (maxRoom.value) {
    room.value.label = `${maxRoom.value} 房以下`
    room.value.value = `-${maxRoom.value}`
  }
}

const onChange = (data) => {
  const { value } = data

  if (model.value.length === 0) {
    room.value.label = `格局${room.value.options[0].label}`
    room.value.value = ''
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
  room.value.value = isSame ? nextMax : `${nextMin}-${nextMax}`

  minRoom.value = null
  maxRoom.value = null
}
</script>

<template>
  <FormSelectDropdown
    :name="`${props.name}Dropdown`"
    v-model="room.label"
    :setClass="{
      main: 'p:--h-45 p:--px-12 p:--py-10 w-full',
      dropdownContainer: 'min-w-[170px] p:p-[20px]',
    }"
    ref="selectDropdownRef"
  >
    <ul class="p:space-y-[15px]">
      <li v-for="(item, index) in room.options" :key="`${props.name}_${item.code}_${index}`">
        <FormCheckBox
          :name="props.name"
          v-model="model"
          :config="{
            label: item.label,
            value: item.value,
            isValueEmptyClickClear: true,
            sort: 'asc',
          }"
          @change="onChange"
        />
      </li>
      <li class="flex items-center p:gap-x-[10px]">
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
            main: 'p:--h-35 p:--px-12 p:--py-5 p:w-[55px]',
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
            main: 'p:--h-35 p:--px-12 p:--py-5 p:w-[55px]',
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
            label: '房數不含加蓋',
            mode: 'boolean',
          }"
        />
      </li>
    </ul>
  </FormSelectDropdown>
</template>

<style></style>
