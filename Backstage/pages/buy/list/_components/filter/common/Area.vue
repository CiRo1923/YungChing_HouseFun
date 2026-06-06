<script setup>
import SelectDropdownOptions from '@components/buy/mForm/SelectDropdownOptions.vue'

const buyList = useBuyListStore()
const { apiSearchData, serachOptions } = storeToRefs(buyList)

const dropdownRef = ref(null)
const cityPanelRef = ref(null)
const districtPanelRef = ref(null)
const model = ref({
  city: apiSearchData.value.cityToken,
  district: apiSearchData.value.districtToken,
  label: '不限',
})

const rafId = ref(null)
const activePanel = ref('city')
const direction = ref(null)
const animating = ref(null)

const cityOptions = computed(() =>
  serachOptions.value.area.map(({ value, text }) => ({
    value,
    text,
  }))
)

const districtOptions = computed(() => {
  const city = serachOptions.value.area.find((item) => item.value === model.value.city)

  return city?.district || []
})

const selectCityLabel = computed(() => {
  const city = cityOptions.value.find((item) => item.value === model.value.city)

  return city?.text
})

const onActive = (area, key) => {
  return key === 'city' ? area.value === model.value[key] : model.value[key].includes(area.value)
}

const onGetKey = (area, index) => {
  return `${area.text}_${index}`
}

const onStartAnimate = (panel) => {
  onCancelAnimationFram()

  // 先清掉 animating，確保是「無 transition 的初始狀態」
  animating.value = null

  // 下一個 frame 再開啟 transition
  direction.value = panel === 'district' ? '--left' : '--right'
  animating.value = null

  rafId.value = requestAnimationFrame(() => {
    animating.value = '--animating'
    activePanel.value = panel
    rafId.value = null
  })
}

const onCancelAnimationFram = () => {
  if (rafId.value != null) cancelAnimationFrame(rafId.value)
}

const onTrackTransitionEnd = (e) => {
  if (e.propertyName !== 'transform') return

  animating.value = null
  direction.value = null
}

const onCityClick = async (item) => {
  const { text, value } = item
  const isActiveCity = model.value.city === value

  model.value.district = []

  if (isActiveCity) {
    model.value.city = 0
    model.value.label = '不限'
    apiSearchData.value.cityToken = model.value.city
    apiSearchData.value.districtToken = model.value.district

    return
  }

  model.value.city = value
  model.value.label = text
  apiSearchData.value.cityToken = model.value.city
  apiSearchData.value.districtToken = model.value.district

  await nextTick()
  onStartAnimate('district')

  await dropdownRef.value?.onDropdownHeightUpdate({
    frames: 2,
    target: districtPanelRef,
  })
}

const onBackToCity = async () => {
  if (activePanel.value === 'city') return

  onStartAnimate('city')

  await dropdownRef.value?.onDropdownHeightUpdate({
    frames: 2,
    target: cityPanelRef,
  })
}

const onAreaClick = (item) => {
  const index = model.value.district.findIndex((value) => value === item.value)

  if (index > -1) {
    model.value.district.splice(index, 1)
  } else {
    model.value.district.push(item.value)
  }

  const district = model.value.district || []

  apiSearchData.value.districtToken = district

  model.value.label = district.length
    ? district
        .map((value) => {
          const option = districtOptions.value.find((item) => item.value === value)

          return option ? `${selectCityLabel.value}-${option.text}` : null
        })
        .filter(Boolean)
    : selectCityLabel.value
}

onUnmounted(() => {
  onCancelAnimationFram()
})
</script>

<template>
  <BuyMFormDropdown
    name="addr"
    v-model="model.label"
    :setClass="{
      main: '--h-40 --px-12 --py-8 p:w-[160px]',
      dropdown: 't:w-[250px] p:w-[300px]',
      dropdownBody: 'm:max-h-[258px] pt:max-h-[208px]',
    }"
    ref="dropdownRef"
  >
    <template #dropdownHeader>
      <p class="text-[16px] text-[--gray-666]" v-if="activePanel === 'city'">請選擇縣市</p>
      <BuyMAnchor
        text="改選其他縣市"
        :config="{
          icon: {
            name: 'chevron_left',
            position: 'left',
          },
        }"
        :setClass="{
          main: 'text-[--gray-666]',
          text: 'text-[16px] underline',
          icon: 'h-[16px] w-[16px] p-[2px]',
        }"
        @click="onBackToCity"
        v-if="activePanel === 'district'"
      />
    </template>
    <template #dropdown>
      <div class="area-dropdown overflow-hidden">
        <div
          class="area-dropdown-track flex w-[200%] will-change-transform"
          :class="[animating, direction, `--${activePanel}`]"
          @transitionend="onTrackTransitionEnd"
        >
          <div class="w-1/2 shrink-0" ref="cityPanelRef">
            <SelectDropdownOptions
              :options="cityOptions"
              :config="{
                schema: {
                  label: 'text',
                  value: 'value',
                },
              }"
              :setClass="{
                dropdownOptions: 'w-full',
              }"
              :isActiveOption="(area) => onActive(area, 'city')"
              :onItemClick="onCityClick"
              :getKey="onGetKey"
            />
          </div>
          <div class="w-1/2 shrink-0" ref="districtPanelRef">
            <SelectDropdownOptions
              :options="districtOptions"
              :config="{
                schema: {
                  label: 'text',
                  value: 'value',
                },
              }"
              :isActiveOption="(area) => onActive(area, 'district')"
              :onItemClick="onAreaClick"
              :getKey="onGetKey"
            />
          </div>
        </div>
      </div>
    </template>
    <template #dropdownFooter v-if="activePanel === 'district'">
      <p class="text-[16px] text-[--gray-666]">目前選擇{{ selectCityLabel }}</p>
    </template>
  </BuyMFormDropdown>
</template>

<style lang="postcss">
.area-dropdown-track {
  &.\-\-animating {
    @apply transition-transform duration-300;
  }

  &.\-\-district {
    @apply -translate-x-1/2;
  }

  &.\-\-city {
    @apply translate-x-0;
  }
}
</style>
