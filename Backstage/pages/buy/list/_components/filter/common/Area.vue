<script setup>
import SelectDropdownOptions from '@components/common/mForm/SelectDropdownOptions.vue'

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

const activePanel = ref('city')
// 'left' = 進行政區(內容往左推)、'right' = 回縣市,只用來決定進出場的方向
const direction = ref('left')

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

// 切面板後把共用的捲動容器帶回定位:進行政區回到最頂端,回縣市則捲到目前選擇的那一個。
// 只有進場的面板留在文件流裡(離場的是 absolute),所以這裡量到的高度就是新面板的高度。
const onPanelScroll = async (panel) => {
  await nextTick()

  const $body = dropdownRef.value?.dropdownBodyRef

  if (!$body) return

  if (panel === 'district') {
    $body.scrollTop = 0

    return
  }

  // 用 index 取項目而不是 querySelector('.--active') —— 避開 `--` 開頭的 class 選擇器
  const activeIndex = cityOptions.value.findIndex((item) => item.value === model.value.city)
  const $items = cityPanelRef.value?.querySelectorAll('.m-form-dropdown-item')
  const $active = activeIndex > -1 ? $items?.[activeIndex] : null

  if (!$active) {
    $body.scrollTop = 0

    return
  }

  // 讓選中的縣市落在可視範圍中間;上界交給瀏覽器自己夾
  const bodyRect = $body.getBoundingClientRect()
  const activeRect = $active.getBoundingClientRect()
  const offset = activeRect.top - bodyRect.top - ($body.clientHeight - activeRect.height) / 2

  $body.scrollTop = Math.max($body.scrollTop + offset, 0)
}

const onSwitchPanel = async (panel) => {
  direction.value = panel === 'district' ? 'left' : 'right'
  activePanel.value = panel

  onPanelScroll(panel)

  await dropdownRef.value?.onDropdownHeightUpdate({
    frames: 2,
    target: panel === 'district' ? districtPanelRef : cityPanelRef,
  })
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
  await onSwitchPanel('district')
}

const onBackToCity = async () => {
  if (activePanel.value === 'city') return

  await onSwitchPanel('city')
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
</script>

<template>
  <CommonMFormDropdown
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
      <!--
        同一時間只有一個面板在文件流裡。兩個面板若並排,捲動容器的高度會等於「較長的那一個」,
        切到較短的面板時下方就會露出一段空白(例如台北市 12 區 vs 22 個縣市)。
        離場的面板改用 absolute 脫離文件流,高度只由進場的面板決定。
      -->
      <div class="area-dropdown relative overflow-hidden">
        <Transition :name="`area-slide-${direction}`">
          <div key="city" ref="cityPanelRef" v-if="activePanel === 'city'">
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
          <div key="district" ref="districtPanelRef" v-else>
            <SelectDropdownOptions
              :options="districtOptions"
              :config="{
                schema: {
                  label: 'text',
                  value: 'value',
                },
              }"
              :setClass="{
                dropdownOptions: 'w-full',
              }"
              :isActiveOption="(area) => onActive(area, 'district')"
              :onItemClick="onAreaClick"
              :getKey="onGetKey"
            />
          </div>
        </Transition>
      </div>
    </template>
    <template #dropdownFooter v-if="activePanel === 'district'">
      <p class="text-[16px] text-[--gray-666]">目前選擇{{ selectCityLabel }}</p>
    </template>
  </CommonMFormDropdown>
</template>

<style lang="postcss">
.area-slide-left-enter-active,
.area-slide-left-leave-active,
.area-slide-right-enter-active,
.area-slide-right-leave-active {
  @apply transition-transform duration-300;
}

/* 離場面板脫離文件流,容器高度才不會被它撐著 —— 這是空白問題的關鍵 */
.area-slide-left-leave-active,
.area-slide-right-leave-active {
  @apply absolute inset-x-0 top-0;
}

.area-slide-left-enter-from,
.area-slide-right-leave-to {
  @apply translate-x-full;
}

.area-slide-left-leave-to,
.area-slide-right-enter-from {
  @apply -translate-x-full;
}
</style>
