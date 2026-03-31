<script setup>
import FormSelectDropdown from '@components/buy/mForm/SelectDropdown.vue'
import FormRadio from '@components/buy/mForm/Radio.vue'

import PriceTotal from '@pages/buy/_components/_PriceTotal.vue'
import PriceRepayment from '@pages/buy/_components/_PriceRepayment.vue'

import { useHomeStore } from '@stores/buy/home.js'

const home = useHomeStore()
const { price } = storeToRefs(home)

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

const onChange = async () => {
  await nextTick()
  await selectDropdownRef.value?.onDropdownHeight()
}
</script>

<template>
  <FormSelectDropdown
    :name="`${props.name}Dropdown`"
    v-model="price.label"
    :setClass="{
      main: 'p:--h-45 p:--px-12 p:--py-10 w-full',
      dropdownContainer: 'p:min-w-[270px] p:p-[20px]',
    }"
    ref="selectDropdownRef"
  >
    <ul class="flex items-center border-b-[1px] border-b-[--gray-ccce] p:mb-[15px] p:pb-[15px]">
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
  </FormSelectDropdown>
</template>

<style></style>
