<script setup>
import FormSelectDropdown from '@components/buy/mForm/SelectDropdown.vue'
import Anchor from '@components/buy/mAnchor.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import { useBuyListStore } from '@stores/buy/list.js'

const buyList = useBuyListStore()
const { mrt } = storeToRefs(buyList)

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})

const selectDropdownRef = ref(null)
const activeAreaID = ref(null)
const activeLinesID = ref(null)

const lines = computed(() => {
  const { options } = mrt.value
  const matchedIndex = activeAreaID.value
    ? options.findIndex((item) => item.id === activeAreaID.value)
    : -1

  return matchedIndex !== -1 ? options[matchedIndex].lines : []
})

const stations = computed(() => {
  const matchedIndex = activeLinesID.value
    ? lines.value.findIndex((item) => item.id === activeLinesID.value)
    : -1

  return matchedIndex !== -1 ? lines.value[matchedIndex].stations : []
})

const getData = computed(() => {
  const { apiData, options } = mrt.value
  const valueArray = apiData ? apiData.split(',') : []

  return valueArray.map((val) => {
    let area = null
    let lines = null
    let stations = null

    // 2碼 → 找區域捷運
    if (val.length === 2) {
      area = options.find((item) => item.id === val)
    }

    // 4碼 → 找捷運線
    if (val.length === 4) {
      for (const item of options) {
        const foundLine = item.lines.find((line) => line.id === val)

        if (foundLine) {
          area = item
          lines = foundLine
          break
        }
      }
    }

    // 其他 → 找捷運站
    if (val.length > 4) {
      for (const item of options) {
        const foundLine = item.lines.find((line) =>
          line.stations.some((station) => station.id === val)
        )

        if (foundLine) {
          const foundStation = foundLine.stations.find((station) => station.id === val)

          area = item
          lines = foundLine
          stations = foundStation
          break
        }
      }
    }

    return {
      area: area?.name || null,
      areaID: area?.id || null,
      lines: lines?.name || null,
      linesID: lines?.id || null,
      stations: stations?.name || null,
      stationsID: stations?.id || null,
    }
  })
})

const onGetLabel = () => {
  const datas = getData.value

  mrt.value.label = ''

  for (let i = 0; i < datas.length; i += 1) {
    const { area, lines, stations } = datas[i]
    const areaName = lines ? '' : `${area}全線`
    const linesName = stations ? '' : lines
    const stationsName = stations || ''

    if (mrt.value.label) {
      mrt.value.label += `、${areaName}${linesName}${stationsName}`
    } else {
      mrt.value.label += `${areaName}${linesName}${stationsName}`
    }
  }
}

const onAreaClick = (value) => {
  activeAreaID.value = value
  activeLinesID.value = lines.value[0]?.id ?? ''
  selectDropdownRef.value.onDropdownHeight()
}

const onLinesClick = (value) => {
  activeLinesID.value = value
  selectDropdownRef.value.onDropdownHeight()
}

const onInit = () => {
  const datas = getData.value

  activeAreaID.value = datas[datas.length - 1].areaID
  activeLinesID.value = datas[datas.length - 1].linesID
}

onInit()
onGetLabel()
</script>

<template>
  <FormSelectDropdown
    :name="`${props.name}Dropdown`"
    v-model="mrt.label"
    :config="{
      placeholder: '全捷運',
    }"
    :setClass="{
      main: 'p:--px-12 m:--h-50 pt:--h-45 tm:--px-10 pt:--border pt:--rounded --py-5 w-full',
      dropdown: 'pt:--rounded m:w-full p:max-h-[420px]',
      dropdownContainer: 'p:w-[550px]',
    }"
    ref="selectDropdownRef"
  >
    <div class="flex h-full bg-[--gray-f7]">
      <ul
        class="scrollbar --y max-h-full shrink-0 space-y-[5px] border-y-[20px] border-transparent m:px-[5px] t:px-[10px] p:px-[20px]"
      >
        <li v-for="(item, index) in mrt.options" :key="`mrt_area_${item.id}_${index}`">
          <Anchor
            :text="item.name"
            :setClass="{
              main: [
                'p:--px-20 tm:--px-10 --h-35 --rounded',
                activeAreaID === item.id ? '--bg-green-8b0d --text-white' : '',
              ],
              text: 'font-normal',
            }"
            @click="onAreaClick(item.id)"
          />
        </li>
      </ul>
      <ul
        class="scrollbar --y max-h-full shrink-0 space-y-[5px] border-y-[20px] border-transparent bg-[--blue-efef] m:px-[5px] t:px-[10px] p:w-[165px] p:px-[20px]"
      >
        <li v-for="(item, index) in lines" :key="`mrt_lines_${item.id}_${index}`">
          <Anchor
            :text="item.name"
            :setClass="{
              main: [
                'p:--px-20 tm:--px-10 --h-35 --rounded',
                activeLinesID === item.id ? '--bg-green-8b0d --text-white' : '',
              ],
              text: 'font-normal',
            }"
            @click="onLinesClick(item.id)"
          />
        </li>
      </ul>
      <ul
        class="scrollbar --y max-h-full grow space-y-[20px] border-y-[20px] border-transparent m:px-[5px] t:px-[10px] p:px-[30px]"
      >
        <li v-for="(item, index) in stations" :key="`mrt_stations_${item.id}_${index}`">
          <FormCheckBox
            name="stations"
            v-model="mrt.apiData"
            :config="{
              label: item.name,
              value: item.id,
              isJoin: true,
              valueClickClear: {
                value: activeLinesID,
                regex: `^${activeLinesID}`,
              },
            }"
            @change="onGetLabel"
          />
        </li>
      </ul>
    </div>
  </FormSelectDropdown>
  <!-- <pre>{{ mrt }}</pre> -->
  <!-- <pre>{{ lines }}</pre> -->
</template>

<style></style>
