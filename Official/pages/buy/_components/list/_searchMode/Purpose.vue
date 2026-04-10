<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectStores from '@stores/buy/_composables/useProjectStores.js'

const project = useBuyProjectStore()
const { options } = storeToRefs(project)
const buyList = useBuyListStore()
const { purpose } = storeToRefs(buyList)
const { onValueGetText } = useBuyProjectStores()
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})
const selectDropdownRef = ref(null)
const onChange = (data) => {
  const { value, label } = data

  purpose.value.label = value ? label : purpose.value.defaultLabel
  // selectDropdownRef.value.onClose()
}

const onInit = () => {
  const apiData = purpose.value.apiData

  purpose.value.label = apiData
    ? onValueGetText('casePurpose', apiData).text
    : purpose.value.defaultLabel
}

onInit()
</script>

<template>
  <BuyMFormSelectDropdown
    :name="`${props.name}Dropdown`"
    v-model="purpose.label"
    :setClass="{
      main: 'p:--px-12 m:--h-50 pt:--h-45 tm:--px-10 pt:--border pt:--rounded --py-5 w-full',
      dropdown: 'pt:--rounded m:w-full',
      dropdownContainer: 'm:px-[30px] m:py-[20px] pt:p-[20px] p:min-w-[170px]',
    }"
    ref="selectDropdownRef"
  >
    <ul class="m:grid m:grid-cols-3 m:gap-[15px] pt:space-y-[15px]">
      <li v-for="(item, index) in options.casePurpose" :key="`${props.name}_${item.code}_${index}`">
        <BuyMFormRadio
          :name="props.name"
          v-model="purpose.apiData"
          :config="{
            label: item.text,
            value: item.code,
          }"
          @change="onChange"
        />
      </li>
    </ul>
  </BuyMFormSelectDropdown>
</template>

<style></style>
