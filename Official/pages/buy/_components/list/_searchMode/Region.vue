<script setup>
import { useBuyListStore } from '@stores/buy/list.js'
// import useListActions from '@stores/buy/_composables/useListActions.js'

const buyList = useBuyListStore()
const { region } = storeToRefs(buyList)
// const { onGetRegionData } = useListActions()
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})
const activeCityID = ref(null)

const getData = computed(() => {
  const { apiData, options } = region.value
  const valueArray = apiData ? apiData.split(',') : []

  return valueArray.map((val) => {
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

const onInit = () => {
  const datas = getData.value

  activeCityID.value = datas[datas.length - 1].cityID
}

onInit()
onGetLabel()
</script>

<template>
  <BuyMFormSelectDropdown
    :name="`${props.name}Dropdown`"
    v-model="region.label"
    :config="{
      placeholder: '全區域',
    }"
    :setClass="{
      main: 'p:--px-12 m:--h-50 pt:--h-45 tm:--px-10 pt:--border pt:--rounded --py-5 w-full',
      dropdown: 'pt:--rounded m:w-full p:max-h-[420px]',
      dropdownContainer: 'p:min-w-[490px]',
    }"
  >
    <div class="flex h-full items-start">
      <ul
        class="scrollbar --y max-h-full shrink-0 space-y-[5px] border-y-[20px] border-transparent bg-[--gray-f7] m:px-[5px] t:px-[10px] p:px-[20px]"
      >
        <li v-for="(item, index) in region.options" :key="`region_${item.id}_${index}`">
          <BuyMAnchor
            :text="item.name"
            :setClass="{
              main: [
                'p:--px-20 tm:--px-10 --h-35 --rounded',
                activeCityID === item.id ? '--bg-green-8b0d --text-white' : '',
              ],
              text: 'font-normal',
            }"
            @click="onCityClick(item.id)"
          />
        </li>
      </ul>
      <ul
        class="scrollbar --y grid max-h-full grow grid-cols-2 gap-y-[20px] border-y-[20px] border-transparent tm:px-[20px] p:px-[50px]"
      >
        <li
          :class="{ 'col-span-2': item.id === activeCityID }"
          v-for="(item, index) in areas"
          :key="`${item.id}_${index}`"
        >
          <BuyMFormCheckBox
            name="area"
            v-model="region.apiData"
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
  </BuyMFormSelectDropdown>
</template>

<style></style>
