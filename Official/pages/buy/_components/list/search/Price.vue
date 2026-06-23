<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { price } = storeToRefs(buyList)

const componentsName = 'Price'

const emits = defineEmits(['click:routePush'])
const selectDropdownRef = ref(null)
const type = ref('total')
const isDeviceM = computed(() => device.value === 'm')

const options = readonly([
  {
    label: '總價',
    value: 'total',
  },
  {
    label: '月還款',
    value: 'repayment',
  },
])

const onChange = () => {
  selectDropdownRef.value?.onDropdownHeight()
}

const onClear = () => {}

const onRoutePush = () => {
  emits('click:routePush')
}

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <BuyMFormSelectDropdown
    :name="`${componentsName}Dropdown`"
    v-model="price.label"
    :config="{
      placeholder: '全區域',
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
      dropdown: '--py-20 pt:--rounded pt:--px-20 m:--px-30 m:w-full',
      dropdownContainer: 'm:flex m:flex-col p:w-[270px]',
    }"
    ref="selectDropdownRef"
  >
    <div class="flex flex-col m:min-h-0 m:grow m:overflow-y-auto pt:max-h-full">
      <ul
        class="mb-[15px] flex shrink-0 items-center border-b-[1px] border-b-[--gray-ccce] pb-[15px] tm:gap-x-[20px] p:gap-x-[40px]"
      >
        <li v-for="(item, index) in options" :key="`${componentsName}_${item.value}_${index}`">
          <BuyMFormRadio
            name="priceType"
            v-model="type"
            :config="{
              label: item.label,
              value: item.value,
            }"
            @change="onChange"
          />
        </li>
      </ul>
      <PageBuyListSearchPriceTotal v-if="type === 'total'" />
      <PageBuyListSearchPriceRepayment v-if="type === 'repayment'" />
    </div>
    <PageBuyListActionButton
      @click:clear="onClear"
      @click:routePush="onRoutePush"
      v-if="isDeviceM"
    />
  </BuyMFormSelectDropdown>
</template>

<style></style>
