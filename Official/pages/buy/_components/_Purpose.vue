<script setup>
import FormSelectDropdown from '@components/buy/mForm/SelectDropdown.vue'
import FormRadio from '@components/buy/mForm/Radio.vue'

import { useProjectStore } from '@stores/buy/project.js'
import { useHomeStore } from '@stores/buy/home.js'
import useProjectStores from '@stores/buy/_composables/useProjectStores.js'

const project = useProjectStore()
const home = useHomeStore()
const { options } = storeToRefs(project)
const { purpose } = storeToRefs(home)
const { onValueGetText } = useProjectStores()
const route = useRoute()
// const emits = defineEmits(['change'])
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})
const selectDropdownRef = ref(null)
const onChange = (data) => {
  const { value, label } = data

  purpose.value.label = value ? label : `用途${label}`
  // selectDropdownRef.value.onClose()

  // emits('change')
}

const onInit = () => {
  const queryPurpose = route.query.purpose

  purpose.value.label = queryPurpose
    ? onValueGetText('casePurpose', queryPurpose).text
    : purpose.value.defaultLabel
}

onInit()
</script>

<template>
  <FormSelectDropdown
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
        <FormRadio
          :name="props.name"
          v-model="purpose.query"
          :config="{
            label: item.text,
            value: item.code,
          }"
          @change="onChange"
        />
      </li>
    </ul>
  </FormSelectDropdown>
</template>

<style></style>
