<script setup>
import FormSelectDropdown from '@components/buy/mForm/SelectDropdown.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'
import Anchor from '@components/buy/mAnchor.vue'

import { useHomeStore } from '@stores/buy/home.js'
// import useHomeStores from '@stores/buy/_composables/useHomeStores.js'

const home = useHomeStore()
const { region } = storeToRefs(home)
// const { onGetRegionData } = useHomeStores()
const activeCityID = ref('01')
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})

const getData = computed(() => {
  const { value, options } = region.value
  const areaArray = value ? value.split(',') : []

  return areaArray.map((val) => {
    let city = null
    let area = null

    // 2碼 → 找縣市
    if (val.length === 2) {
      city = options.find((item) => item.id === val)
    }

    // 5碼 → 找區域
    if (val.length === 5) {
      for (const item of options) {
        const found = item.areas.find((a) => a.id === val)

        if (found) {
          city = item
          area = found
          break
        }
      }
    }

    return {
      city: city?.name || null,
      cityID: city?.id || null,
      area: area?.name || null,
      areaID: val,
    }
  })
})

const areas = computed(() => {
  const { options } = region.value
  const matchedIndex = options.findIndex((item) => item.id === activeCityID.value)

  return options[matchedIndex].areas
})

const onGetLabel = () => {
  const datas = getData.value

  region.value.label = ''

  for (let i = 0; i < datas.length; i += 1) {
    const { city, area } = datas[i]
    const areaName = area || ''

    if (region.value.label) {
      region.value.label += `、${city}${areaName}`
    } else {
      region.value.label += `${city}${areaName}`
    }
  }
}

const onCityClick = (value) => {
  activeCityID.value = value
}

onGetLabel()
</script>

<template>
  <FormSelectDropdown
    :name="`${props.name}Dropdown`"
    v-model="region.label"
    :config="{
      placeholder: '全區域',
    }"
    :setClass="{
      main: 'p:--h-45 p:--px-12 p:--py-10 w-full',
      dropdownContainer: 'p:min-w-[490px]',
    }"
  >
    <div class="region-options flex items-start">
      <ul
        class="scrollbar --y shrink-0 border-transparent bg-[--gray-f7] p:max-h-[420px] p:space-y-[5px] p:border-y-[20px] p:px-[20px]"
      >
        <li
          class="region-city-item"
          v-for="(item, index) in region.options"
          :key="`region_${item.id}_${index}`"
        >
          <Anchor
            :text="item.name"
            :setClass="{
              main: [
                'p:--h-35 p:--px-20 --rounded',
                activeCityID === item.id ? '--bg-green-8b0d --text-white' : '',
              ],
              text: 'font-normal',
            }"
            @click="onCityClick(item.id)"
          />
        </li>
      </ul>
      <ul
        class="scrollbar --y grid grow grid-cols-2 border-transparent p:max-h-[420px] p:gap-y-[20px] p:border-y-[20px] p:px-[50px]"
      >
        <li
          :class="{ 'col-span-2': item.id === activeCityID }"
          v-for="(item, index) in areas"
          :key="`${item.id}_${index}`"
        >
          <FormCheckBox
            name="area"
            v-model="region.value"
            :config="{
              label: item.name,
              value: item.id,
              isJoin: true,
              valueClickClear: {
                value: activeCityID,
                regex: `^${activeCityID}`,
              },
            }"
            @change="onGetLabel"
          />
        </li>
      </ul>
    </div>
  </FormSelectDropdown>
</template>
