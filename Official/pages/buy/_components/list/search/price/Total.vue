<script setup>
const buyList = useBuyListStore()
const { apiSearchData, price } = storeToRefs(buyList)

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})

const onRadioChange = (data) => {
  const { value } = data

  if (price.value.range.length === 0) {
    price.value.label = `總價${price.value.options[0].label}`
    apiSearchData.value.price = ''
    price.value.min = null
    price.value.max = null
    return
  }

  const min = price.value.range[0]
  const max = price.value.range[price.value.range.length - 1]
  const range = price.value.options
    .filter((item) => typeof item.value === 'number' && item.value >= min && item.value <= max)
    .map((item) => item.value)

  const hasClickedValue = price.value.range.includes(value)
  let nextModel = range

  if (!hasClickedValue && range.length > 1) {
    const middle = (min + max) / 2
    nextModel =
      value >= middle
        ? range.filter((item) => item <= value)
        : range.filter((item) => item >= value)
  }

  price.value.range = nextModel

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
  apiSearchData.value.price =
    nextMax === 6001
      ? '6000-'
      : nextMin === 0 && nextMax
        ? `-${nextMax}`
        : nextMin === 0
          ? '-1000'
          : `${/^\d+/.exec(minLabel.replace(/\s?萬/, ''))[0]}-${/\d+$/.exec(maxLabel.replace(/\s?萬/, ''))[0]}`

  price.value.min = null
  price.value.max = null
}
</script>

<template>
  <ul class="grow space-y-[15px]">
    <li v-for="(item, index) in price.options" :key="`${props.name}_${item.code}_${index}`">
      <BuyMFormCheckBox
        :name="props.name"
        v-model="price.range"
        :config="{
          label: item.label,
          value: item.value,
          valueClickClear: '',
          sort: 'asc',
        }"
        @change="onRadioChange"
      />
    </li>
    <li>
      <PageBuyListSearchMaxMinRange
        name="price"
        :data="price"
        v-model:min="price.min"
        v-model:max="price.max"
        :config="{
          placeholder: {
            min: '最低價',
            max: '最高價',
          },
          maxlength: 5,
          schema: {
            api: 'price',
          },
          suffix: price.unit,
        }"
      />
    </li>
  </ul>
</template>

<style></style>
