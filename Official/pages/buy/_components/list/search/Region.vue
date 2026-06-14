<script setup>
const buyList = useBuyListStore()
const { region } = storeToRefs(buyList)

const componentsName = 'Region'

const activeCityID = ref(null)

const getData = computed(() => {
  const { ids, options } = region.value
  const list = options || []
  const valueArray = ids ? ids.split(',') : []

  return valueArray.map((val) => {
    let city = null
    let area = null

    // 2碼 → 找縣市
    if (val.length === 2) {
      city = list.find((item) => item.id === val)
    }

    // 5碼 → 找區域
    if (val.length === 5) {
      for (const item of list) {
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
  const options = region.value.options || []
  const matchedIndex = options.findIndex((item) => item.id === activeCityID.value)

  return matchedIndex === -1 ? [] : options[matchedIndex].areas
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

  if (!datas.length) return

  activeCityID.value = datas[datas.length - 1].cityID
}

onInit()
onGetLabel()
</script>

<template>
  <BuyMFormSelectDropdown
    :name="`${componentsName}Dropdown`"
    v-model="region.label"
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
      dropdown: 'pt:--rounded m:w-full p:max-h-[420px]',
      dropdownContainer: 'p:w-[490px]',
    }"
  >
    <div class="flex h-full items-start">
      <ul
        class="scrollbar --y max-h-full shrink-0 space-y-[5px] border-y-[20px] border-transparent bg-[--gray-f7] m:px-[5px] t:px-[10px] tm:min-w-[115px] p:min-w-[155px] p:px-[20px]"
      >
        <li v-for="(item, index) in region.options" :key="`${componentsName}_${item.id}_${index}`">
          <BuyMAnchor
            :text="item.name"
            :setClass="{
              main: [
                'p:--px-20 tm:--px-10 --h-35 --rounded w-full',
                activeCityID === item.id ? '--bg-green-8b0d --text-white' : '',
              ],
              text: 'font-normal',
            }"
            @click="onCityClick(item.id)"
          />
        </li>
      </ul>
      <ul
        class="scrollbar --y grid max-h-full grow grid-cols-2 gap-y-[20px] border-y-[35px] border-transparent tm:px-[20px] p:px-[30px]"
      >
        <li
          :class="{ 'col-span-2': item.id === activeCityID }"
          v-for="(item, index) in areas"
          :key="`${componentsName}_${item.id}_${index}`"
        >
          <BuyMFormCheckBox
            name="area"
            v-model="region.ids"
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
