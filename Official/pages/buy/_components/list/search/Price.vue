<script setup>
const buyList = useBuyListStore()
const { price } = storeToRefs(buyList)

const componentsName = 'Price'

const selectDropdownRef = ref(null)
const type = ref('total')
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
      dropdownContainer: 'p:w-[270px]',
    }"
    ref="selectDropdownRef"
  >
    <div class="flex max-h-full flex-col">
      <ul
        class="mb-[15px] flex shrink-0 items-center border-b-[1px] border-b-[--gray-ccce] pb-[15px] p:gap-x-[40px]"
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
  </BuyMFormSelectDropdown>
</template>

<style></style>
