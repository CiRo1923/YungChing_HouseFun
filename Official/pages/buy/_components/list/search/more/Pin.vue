<script setup>
const buyList = useBuyListStore()
const { apiSearchData, pin } = storeToRefs(buyList)
const options = readonly([
  {
    label: '建坪',
    value: 'buildpin',
  },
  {
    label: '主＋陽',
    value: 'usepin',
  },
  {
    label: '地坪',
    value: 'landpin',
  },
])

const onTypeChange = () => {
  const currentType = pin.value.type
  // 找出舊類型殘留的值，沿用到新選中的 type
  const prevType = options.find(
    ({ value }) => value !== currentType && apiSearchData.value[value]
  )
  if (prevType) {
    apiSearchData.value[currentType] = apiSearchData.value[prevType.value]
  }
  // 清空非當下選中的 key（保留 key，不移除）
  options.forEach(({ value }) => {
    if (value !== currentType) {
      apiSearchData.value[value] = ''
    }
  })
}

const onChange = () => {}
</script>

<template>
  <div class="flex max-h-full flex-col">
    <ul
      class="mb-[15px] flex shrink-0 items-center gap-x-[20px] border-b-[1px] border-b-[--gray-ccce] pb-[15px]"
    >
      <li v-for="(item, index) in options" :key="`pinType_${item.value}_${index}`">
        <BuyMFormRadio
          name="pinType"
          v-model="pin.type"
          :config="{
            label: item.label,
            value: item.value,
          }"
          @change="onTypeChange"
        />
      </li>
    </ul>
    <ul class="space-y-[20px]">
      <li v-for="(item, index) in pin.options" :key="`pin_${item.value}_${index}`">
        <BuyMFormRadio
          name="pin"
          v-model="apiSearchData[pin.type]"
          :config="{
            label: item.label,
            value: item.value,
          }"
          @change="onChange"
        />
      </li>
      <li>
        <PageBuyListSearchMaxMinRange
          name="pin"
          :data="pin"
          v-model:min="pin.min"
          v-model:max="pin.max"
          :config="{
            placeholder: {
              min: '最低',
              max: '最高',
            },
            suffix: pin.unit,
            schema: {
              api: pin.type,
            },
          }"
        />
      </li>
    </ul>
  </div>
</template>

<style lang="postcss"></style>
