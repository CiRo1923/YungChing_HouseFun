<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { apiSearchData, serachOptions } = storeToRefs(buyList)

const isDeviceM = computed(() => device.value === 'm')
const hasRangeValue = (value) => value !== '' && value != null
const onRangeUpdate = (item, rangeName, value) => {
  apiSearchData.value[rangeName] = value

  if (hasRangeValue(value)) {
    apiSearchData.value[item.name] = '999'
  }
}
const items = computed(() => {
  return [
    {
      key: 'room',
      name: 'roomCountToken',
      header: '選擇房數',
      options: serachOptions.value.room,
      model: toRef(apiSearchData.value, 'roomCountToken'),
      rearAssist: '房',
    },
    {
      key: 'price',
      name: 'priceToken',
      header: '選擇總價',
      options: serachOptions.value.price,
      model: toRef(apiSearchData.value, 'priceToken'),
      rearAssist: '萬',
    },
    {
      key: 'pin',
      name: 'pinToken',
      header: '選擇坪數',
      options: serachOptions.value.pin,
      model: toRef(apiSearchData.value, 'pinToken'),
      rearAssist: '坪',
    },
  ]
})

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <BuyMFormSelectMultiple
    :items="items"
    :config="{
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 p:w-[140px]',
      dropdown: 'p:w-[665px]',
    }"
    v-if="!isDeviceM"
  >
    更多條件 ({{ items.length }})

    <template #dropdownHeader="{ data }">
      <p class="text-[16px] text-[--gray-666]">{{ data.header }}</p>
    </template>
    <template #dropdownFooter="{ data }">
      <div class="flex items-center gap-x-[4px] overflow-hidden">
        <BuyMFormInput
          :name="`${data.key}RangeMin`"
          :modelValue="apiSearchData[`${data.key}RangeMin`]"
          @update:modelValue="onRangeUpdate(data, `${data.key}RangeMin`, $event)"
          :config="{
            hasClearButton: false,
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
        >
          <template #rearAssist>{{ data.rearAssist }}</template>
        </BuyMFormInput>
        <small>-</small>
        <BuyMFormInput
          :name="`${data.key}RangeMax`"
          :modelValue="apiSearchData[`${data.key}RangeMax`]"
          @update:modelValue="onRangeUpdate(data, `${data.key}RangeMax`, $event)"
          :config="{
            hasClearButton: false,
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
        >
          <template #rearAssist>{{ data.rearAssist }}</template>
        </BuyMFormInput>
      </div>
    </template>
  </BuyMFormSelectMultiple>
  <template v-if="isDeviceM">
    <BuyMFormSelect
      :name="item.name"
      v-model="apiSearchData[item.name]"
      :options="item.options"
      :config="{
        placeholder: item.header,
        schema: {
          label: 'text',
          value: 'value',
        },
      }"
      :setClass="{
        main: '--h-40 --px-12 --py-8',
      }"
      v-for="(item, index) in items"
      :key="`${item.name}_${index}`"
    />
  </template>
</template>

<style lang="postcss"></style>
