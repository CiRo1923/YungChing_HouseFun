<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { region } = storeToRefs(buyList)

const componentsName = 'Region'

const emits = defineEmits(['click:routePush'])
const activeCityID = ref(null)
const isDeviceM = computed(() => device.value === 'm')

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
  // 區域 → 「縣市-區域」;全區(無區域)→ 只顯示「縣市」;各項以「、」串接。
  // 防禦:找不到對應縣市(city 為 null,例如無效代碼)時整段略過,避免顯示「null」。
  region.value.label = getData.value
    .filter(({ city }) => city)
    .map(({ city, area }) => (area ? `${city}-${area}` : city))
    .join('、')
}

// 下拉左欄縣市名稱後方的已選數量:選了 N 個具體區域 → (N);全區或未選 → 純縣市名
const onCityLabel = (item) => {
  const ids = region.value.ids ? region.value.ids.split(',') : []

  // 具體區域:比對該市底下被勾選的區域(排除代表全區的縣市碼本身)
  const count = (item.areas || []).filter((area) => area.id !== item.id && ids.includes(area.id))
    .length

  return count > 0 ? `${item.name}(${count})` : item.name
}

const onCityClick = (value) => {
  activeCityID.value = value
}

const onClear = () => {
  region.value.ids = region.value.defaultIDs
  onCityClick(region.value.ids)
  onGetLabel()
  onRoutePush()
}

const onRoutePush = () => {
  emits('click:routePush')
}

const onInit = () => {
  const datas = getData.value

  if (!datas.length) return

  activeCityID.value = datas[datas.length - 1].cityID
}

onInit()
onGetLabel()
onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <CommonMFormSelectDropdown
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
      dropdownContainer: 'm:flex m:flex-col p:w-[490px]',
    }"
  >
    <div class="flex items-start m:min-h-0 m:grow pt:h-full">
      <div
        class="h-full shrink-0 border-y-[20px] border-transparent bg-[--gray-f7] m:px-[2px] pt:px-[5px]"
      >
        <ul
          class="scrollbar --y max-h-full space-y-[5px] tm:min-w-[115px] tm:px-[10px] p:min-w-[155px] p:px-[15px]"
        >
          <li
            v-for="(item, index) in region.options"
            :key="`${componentsName}_${item.id}_${index}`"
          >
            <CommonMAnchor
              :text="onCityLabel(item)"
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
      </div>
      <div class="h-full grow border-y-[20px] border-transparent m:px-[2px] pt:px-[5px]">
        <ul class="scrollbar --y grid max-h-full grid-cols-2 gap-y-[20px] tm:px-[10px] p:px-[15px]">
          <li
            :class="{ 'col-span-2': item.id === activeCityID }"
            v-for="(item, index) in areas"
            :key="`${componentsName}_${item.id}_${index}`"
          >
            <CommonMFormCheckBox
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
              :setClass="{
                main: '--icon-size-20 --checkbox-green-8d0d',
              }"
              @change="onGetLabel"
            />
          </li>
        </ul>
      </div>
    </div>
    <PageBuyListActionButton
      @click:clear="onClear"
      @click:routePush="onRoutePush"
      v-if="isDeviceM"
    />
  </CommonMFormSelectDropdown>
</template>

<style></style>
