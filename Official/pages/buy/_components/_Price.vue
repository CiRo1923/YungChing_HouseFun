<script setup>
import FormSelectDropdown from '@components/buy/mForm/SelectDropdown.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'
import FormInput from '@components/buy/mForm/Input.vue'

import { useHomeStore } from '@stores/buy/home.js'

const home = useHomeStore()
const { price } = storeToRefs(home)

const emits = defineEmits(['change'])
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})
const selectDropdownRef = ref(null)
const minPrice = ref(null)
const maxPrice = ref(null)
const model = ref([])

const onInputBlur = () => {
  const hasRoom = maxPrice.value || minPrice.value
  const max = Number(maxPrice.value)
  const min = Number(minPrice.value)
  const isSame = max === min

  if (hasRoom) {
    model.value = [null]
  } else {
    model.value = []
  }

  if (max && min && max < min) {
    minPrice.value = max
    maxPrice.value = min
  }

  if (isSame) {
    price.value.label = `${maxPrice.value} 萬`
    price.value.value = maxPrice.value
  }

  if (minPrice.value && maxPrice.value) {
    price.value.label = `${minPrice.value} - ${maxPrice.value} 萬`
    price.value.value = `${minPrice.value}-${maxPrice.value}`
  } else if (minPrice.value) {
    price.value.label = `${minPrice.value} 萬以上`
    price.value.value = `${minPrice.value}-`
  } else if (maxPrice.value) {
    price.value.label = `${maxPrice.value} 萬以下`
    price.value.value = `-${maxPrice.value}`
  }

  // emits('change')
}

const onChange = (data) => {
  const { value } = data

  console.log(model.value)

  if (model.value.length === 0) {
    price.value.label = `總價${price.value.options[0].label}`
    price.value.value = ''
    minPrice.value = null
    maxPrice.value = null
    return
  }

  const min = model.value[0]
  const max = model.value[model.value.length - 1]
  const range = price.value.options
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
  const minLabel = price.value.options.find((item) => item.value === nextMin).label
  const maxLabel = price.value.options.find((item) => item.value === nextMax).label

  price.value.label = isSame
    ? maxLabel
    : nextMax === 6001
      ? maxLabel
      : nextMin === 0
        ? `${nextMax} 萬以下`
        : `${/^\d+/.exec(minLabel.replace(/\s?萬/, ''))[0]} - ${/\d+$/.exec(maxLabel.replace(/\s?萬/, ''))[0]} 萬`
  price.value.value =
    nextMax === 6001
      ? '6000-'
      : nextMin === 0 && nextMax
        ? `-${nextMax}`
        : nextMin === 0
          ? '-1000'
          : `${/^\d+/.exec(minLabel.replace(/\s?萬/, ''))[0]}-${/\d+$/.exec(maxLabel.replace(/\s?萬/, ''))[0]}`

  minPrice.value = null
  maxPrice.value = null
}
</script>

<template>
  <FormSelectDropdown
    :name="`${props.name}Dropdown`"
    v-model="price.label"
    :setClass="{
      main: 'p:--h-45 p:--px-12 p:--py-10 w-full',
      dropdownContainer: 'min-w-[270px] p:p-[20px]',
    }"
    ref="selectDropdownRef"
  >
    <ul class="p:space-y-[15px]">
      <li v-for="(item, index) in price.options" :key="`${props.name}_${item.code}_${index}`">
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
          name="minPrice"
          v-model="minPrice"
          :config="{
            placeholder: '最低價',
            inputMode: 'numeric',
            inputChinese: false,
            isExistClose: false,
            integer: true,
            checkNotIsZero: true,
          }"
          :setClass="{
            main: 'p:--h-35 p:--px-12 p:--py-5 p:w-[80px]',
          }"
          @blur="onInputBlur"
        />
        <span>-</span>
        <FormInput
          name="maxPrice"
          v-model="maxPrice"
          :config="{
            placeholder: '最高價',
            inputMode: 'numeric',
            inputChinese: false,
            isExistClose: false,
            integer: true,
            checkNotIsZero: true,
          }"
          :setClass="{
            main: 'p:--h-35 p:--px-12 p:--py-5 p:w-[80px]',
          }"
          @blur="onInputBlur"
        />
        <span>萬</span>
      </li>
    </ul>
  </FormSelectDropdown>
</template>

<style></style>
