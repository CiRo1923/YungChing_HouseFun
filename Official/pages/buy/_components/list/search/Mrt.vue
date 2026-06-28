<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { mrt } = storeToRefs(buyList)

const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

const componentsName = 'Mrt'

const selectDropdownRef = ref(null)
const activeAreaID = ref(null)
const activeLinesID = ref(null)

const config = computed(() => {
  return {
    areaAxis: 'y', // 'x' | 'y' | {p: 'x' | 'y', pt: 'x' | 'y', tm: 'x' | 'y', t: 'x' | 'y', m: 'x' | 'y'}
    ...props.config,
  }
})

const areaAxis = computed(() => {
  const { areaAxis: axis } = config.value

  // 字串時直接使用；物件時依 device（只會是 p | t | m）對應
  if (typeof axis === 'string') return axis

  const map = {
    p: axis.p ?? axis.pt,
    t: axis.t ?? axis.pt ?? axis.tm,
    m: axis.m ?? axis.tm,
  }

  return map[device.value] ?? 'y'
})

const isAreaAxisX = computed(() => areaAxis.value === 'x')
const isAreaAxisY = computed(() => areaAxis.value === 'y')

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
  const { ids, options } = mrt.value
  const valueArray = ids ? ids.split(',') : []

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

const onAnchorClass = (item) => {
  const { id } = item
  const isActive =
    activeAreaID.value === id
      ? '--bg-green-8b0d --text-white'
      : isAreaAxisX.value
        ? '--bg-gray-f2 --text-gray-666'
        : ''

  if (isAreaAxisX.value) return `--oval --h-45 --px-20 ${isActive}`
  if (isAreaAxisY.value) return `p:--px-20 tm:--px-10 --h-35 --rounded ${isActive}`

  return ''
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

onResize()
onInit()
onGetLabel()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <BuyMFormSelectDropdown
    :name="`${componentsName}Dropdown`"
    v-model="mrt.label"
    :config="{
      placeholder: '全捷運',
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
      dropdownContainer: 'p:w-[560px]',
    }"
    ref="selectDropdownRef"
  >
    <div class="mrt flex h-full" :class="isAreaAxisX ? '--axis-x' : '--axis-y'">
      <div class="mrt-area shrink-0">
        <ul
          class="mrt-area-items scrollbar"
          :class="[{ '--x': isAreaAxisX }, { '--y': isAreaAxisY }]"
        >
          <li
            class="mrt-area-item"
            v-for="(item, index) in mrt.options"
            :key="`${componentsName}_area_${item.id}_${index}`"
          >
            <BuyMAnchor
              :text="item.name"
              :setClass="{
                main: onAnchorClass(item),
                text: 'font-normal',
              }"
              @click="onAreaClick(item.id)"
            />
          </li>
        </ul>
      </div>
      <div class="mrt-lines-stations flex grow">
        <div
          class="mrt-lines max-h-full shrink-0 border-y-[20px] border-transparent m:px-[2px] pt:px-[5px]"
        >
          <ul class="scrollbar --y max-h-full space-y-[5px] tm:px-[10px] p:w-[165px] p:px-[15px]">
            <li v-for="(item, index) in lines" :key="`${componentsName}_lines_${item.id}_${index}`">
              <BuyMAnchor
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
        </div>
        <div class="mrt-stations grow border-y-[20px] border-transparent m:px-[2px] pt:px-[5px]">
          <ul class="scrollbar --y max-h-full space-y-[20px] m:px-[3px] t:px-[10px] p:px-[15px]">
            <li
              v-for="(item, index) in stations"
              :key="`${componentsName}_stations_${item.id}_${index}`"
            >
              <BuyMFormCheckBox
                name="stations"
                v-model="mrt.ids"
                :config="{
                  label: item.name,
                  value: item.id,
                  isJoin: true,
                  valueClickClear: {
                    value: activeLinesID,
                    regex: `^${activeLinesID}`,
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
    </div>
  </BuyMFormSelectDropdown>
  <!-- <pre>{{ mrt }}</pre> -->
  <!-- <pre>{{ lines }}</pre> -->
</template>

<style lang="postcss">
.mrt {
  &.\-\-axis-x {
    @apply flex-col overflow-hidden;

    .mrt-area-items {
      @apply flex items-center gap-[8px] border-x-[10px] border-transparent py-[15px];
    }

    .mrt-area-item {
      @apply shrink-0;
    }

    .mrt-lines-stations {
      @apply min-h-0;
    }

    .mrt-lines {
      @apply bg-[--gray-f7];
    }
  }

  &.\-\-axis-y {
    @apply bg-[--gray-f7];

    .mrt-area {
      @apply h-full;
    }

    .mrt-area-items {
      @apply max-h-full space-y-[5px] border-y-[20px] border-transparent;
    }

    .mrt-lines {
      @apply bg-[--green-ffe9];
    }
  }
}

@screen p {
  .mrt {
    &.\-\-axis-y {
      .mrt-area-items {
        @apply px-[20px];
      }
    }
  }
}

@screen t {
  .mrt {
    &.\-\-axis-y {
      .mrt-area-items {
        @apply px-[10px];
      }
    }
  }
}

@screen m {
  .mrt {
    &.\-\-axis-y {
      .mrt-area-items {
        @apply px-[5px];
      }
    }
  }
}
</style>
