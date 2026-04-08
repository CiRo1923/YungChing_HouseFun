<script setup>
import FormSelectDropdown from '@components/buy/mForm/SelectDropdown.vue'
import FormRadio from '@components/buy/mForm/Radio.vue'

import PriceTotal from '@pages/buy/_components/list/_searchMode/PriceTotal.vue'
import PriceRepayment from '@pages/buy/_components/list/_searchMode/PriceRepayment.vue'

import { useListStore } from '@stores/buy/list.js'

const list = useListStore()
const { price } = storeToRefs(list)

// const emits = defineEmits(['change'])
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})
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
  <FormSelectDropdown
    :name="`${props.name}Dropdown`"
    v-model="price.label"
    :setClass="{
      main: 'p:--px-12 m:--h-50 pt:--h-45 tm:--px-10 pt:--border pt:--rounded --py-5 w-full',
      dropdown: 'pt:--rounded m:w-full',
      dropdownContainer: 'm:px-[30px] m:py-[20px] pt:p-[20px] p:w-[270px]',
    }"
    ref="selectDropdownRef"
  >
    <div class="flex max-h-full flex-col">
      <ul
        class="mb-[15px] flex shrink-0 items-center border-b-[1px] border-b-[--gray-ccce] pb-[15px]"
      >
        <li class="flex-1" v-for="(item, index) in options" :key="`${item.value}_${index}`">
          <FormRadio
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
      <PriceTotal v-if="type === 'total'" />
      <PriceRepayment v-if="type === 'repayment'" />
    </div>
  </FormSelectDropdown>
</template>

<style></style>
