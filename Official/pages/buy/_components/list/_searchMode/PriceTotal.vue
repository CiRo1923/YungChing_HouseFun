<script setup>
import { useBuyListStore } from '@stores/buy/list.js'

const buyList = useBuyListStore()
const { price } = storeToRefs(buyList)

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})

const onInputBlur = () => {
  const hasRoom = price.value.maxPrice || price.value.minPrice
  const max = Number(price.value.maxPrice)
  const min = Number(price.value.minPrice)
  const isSame = max === min

  if (hasRoom) {
    price.value.model = [null]
  } else {
    price.value.model = []
  }

  if (max && min && max < min) {
    price.value.minPrice = max
    price.value.maxPrice = min
  }

  if (isSame) {
    price.value.label = `${price.value.maxPrice} 萬`
    price.value.apiData = price.value.maxPrice
  }

  if (price.value.minPrice && price.value.maxPrice) {
    price.value.label = `${price.value.minPrice} - ${price.value.maxPrice} 萬`
    price.value.apiData = `${price.value.minPrice}-${price.value.maxPrice}`
  } else if (price.value.minPrice) {
    price.value.label = `${price.value.minPrice} 萬以上`
    price.value.apiData = `${price.value.minPrice}-`
  } else if (price.value.maxPrice) {
    price.value.label = `${price.value.maxPrice} 萬以下`
    price.value.apiData = `-${price.value.maxPrice}`
  }

  // emits('change')
}

const onRadioChange = (data) => {
  const { value } = data

  if (price.value.model.length === 0) {
    price.value.label = `總價${price.value.options[0].label}`
    price.value.apiData = ''
    price.value.minPrice = null
    price.value.maxPrice = null
    return
  }

  const min = price.value.model[0]
  const max = price.value.model[price.value.model.length - 1]
  const range = price.value.options
    .filter((item) => typeof item.value === 'number' && item.value >= min && item.value <= max)
    .map((item) => item.value)

  const hasClickedValue = price.value.model.includes(value)
  let nextModel = range

  if (!hasClickedValue && range.length > 1) {
    const middle = (min + max) / 2
    nextModel =
      value >= middle
        ? range.filter((item) => item <= value)
        : range.filter((item) => item >= value)
  }

  price.value.model = nextModel

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
  price.value.apiData =
    nextMax === 6001
      ? '6000-'
      : nextMin === 0 && nextMax
        ? `-${nextMax}`
        : nextMin === 0
          ? '-1000'
          : `${/^\d+/.exec(minLabel.replace(/\s?萬/, ''))[0]}-${/\d+$/.exec(maxLabel.replace(/\s?萬/, ''))[0]}`

  price.value.minPrice = null
  price.value.maxPrice = null
}
</script>

<template>
  <ul class="grow space-y-[15px]">
    <li v-for="(item, index) in price.options" :key="`${props.name}_${item.code}_${index}`">
      <BuyMFormCheckBox
        :name="props.name"
        v-model="price.model"
        :config="{
          label: item.label,
          value: item.value,
          valueClickClear: '',
          sort: 'asc',
        }"
        @change="onRadioChange"
      />
    </li>
    <li class="flex items-center gap-x-[10px]">
      <BuyMFormInput
        name="minPrice"
        v-model="price.minPrice"
        :config="{
          placeholder: '最低價',
          inputMode: 'numeric',
          inputChinese: false,
          isExistClose: false,
          integer: true,
          checkNotIsZero: true,
        }"
        :setClass="{
          main: '--h-35 --px-12 --py-5 --border --rounded p:w-[80px]',
        }"
        @blur="onInputBlur"
      />
      <span>-</span>
      <BuyMFormInput
        name="maxPrice"
        v-model="price.maxPrice"
        :config="{
          placeholder: '最高價',
          inputMode: 'numeric',
          inputChinese: false,
          isExistClose: false,
          integer: true,
          checkNotIsZero: true,
        }"
        :setClass="{
          main: '--h-35 --px-12 --py-5 --border --rounded p:w-[80px]',
        }"
        @blur="onInputBlur"
      />
      <span>萬</span>
    </li>
  </ul>
</template>

<style></style>
