<script setup>
import FormSelectDropdown from '@components/buy/mForm/SelectDropdown.vue'
import FormRadio from '@components/buy/mForm/Radio.vue'

import { useProjectStore } from '@stores/buy/project.js'
import { useHomeStore } from '@stores/buy/home.js'

const project = useProjectStore()
const home = useHomeStore()
const { options } = storeToRefs(project)
const { purpose } = storeToRefs(home)

const emits = defineEmits(['change'])
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
  selectDropdownRef.value.onClose()

  // emits('change')
}
</script>

<template>
  <FormSelectDropdown
    :name="`${props.name}Dropdown`"
    v-model="purpose.label"
    :setClass="{
      main: 'p:--h-45 p:--px-12 p:--py-10 w-full',
      dropdownContainer: 'min-w-[170px] p:p-[20px]',
    }"
    ref="selectDropdownRef"
  >
    <ul class="p:space-y-[15px]">
      <li v-for="(item, index) in options.casePurpose" :key="`${props.name}_${item.code}_${index}`">
        <FormRadio
          :name="props.name"
          v-model="purpose.value"
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
