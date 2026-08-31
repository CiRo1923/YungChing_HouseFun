<script setup>
import '@css/_modules/buy/mSort/variables.css'
import '@css/_modules/buy/mSort/common.css'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const emits = defineEmits(['click'])
const props = defineProps({
  options: {
    type: [Array, Object],
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({}),
  },
})

const defaultConfig = {
  mode: 'button',
  index: null,
  // active: { key, sort } —— 外部提供「目前的排序」,元件重新掛載時據此還原選中狀態。
  // 只靠 index 不行:dropdown 模式的選項會被攤平成 asc / desc 兩筆,索引與 button 模式對不上,
  // 方向也無從表達。找不到對應項時才退回 index。
  active: null,
  maxItems: 5,
  position: 'auto',
}

const sortConfig = computed(() => ({
  ...defaultConfig,
  ...props.config,
}))

const currentMode = ref('button')
const sortOptions = ref([])
const isActive = ref(false)
const activeIndex = ref(null)
const activeSortType = ref(null)
const selectAnchorRef = ref(null)
const dropdownRef = ref(null)
const dropdownItemRef = ref(null)

const normalizedOptions = computed(() => {
  if (Array.isArray(props.options)) return props.options
  return Object.values(props.options || {})
})

const dropdownLabel = computed(() => {
  return sortOptions.value[activeIndex.value]?.label || sortOptions.value[0]?.label || ''
})

const responsiveKeys = ['p', 'pt', 'tm', 't', 'm']

const hasResponsiveConfig = (value) => {
  return value && typeof value === 'object' && responsiveKeys.some((key) => key in value)
}

const isMatchDevice = (value) => {
  const currentDevice = device.value

  return Boolean(
    value[currentDevice] ||
    (value.pt && ['p', 't'].includes(currentDevice)) ||
    (value.tm && ['t', 'm'].includes(currentDevice))
  )
}

const resolveResponsiveConfig = (value) => {
  const resolvedValue = unref(value)

  if (!hasResponsiveConfig(resolvedValue)) return resolvedValue

  const sharedConfig = Object.fromEntries(
    Object.entries(resolvedValue).filter(([key]) => !responsiveKeys.includes(key))
  )

  if (Object.keys(sharedConfig).length) {
    return isMatchDevice(resolvedValue) ? sharedConfig : false
  }

  if ('p' in resolvedValue && device.value === 'p') return resolvedValue.p
  if ('t' in resolvedValue && device.value === 't') return resolvedValue.t
  if ('m' in resolvedValue && device.value === 'm') return resolvedValue.m
  if ('pt' in resolvedValue && ['p', 't'].includes(device.value)) return resolvedValue.pt
  if ('tm' in resolvedValue && ['t', 'm'].includes(device.value)) return resolvedValue.tm

  return false
}

const isFixedElement = (element) => {
  let target = element

  while (target && target !== document.body) {
    if (window.getComputedStyle(target).position === 'fixed') return true

    target = target.parentElement
  }

  return false
}

// 依 { key, sort } 找回選中的項目。dropdown 的 sortOptions 已攤平,方向編碼在索引裡;
// button 則是原始選項 + activeSortType 表示方向。找不到回 false,交給呼叫端退回 index。
const onSyncActiveBySort = ({ key, sort }) => {
  if (currentMode.value === 'dropdown') {
    const index = sortOptions.value.findIndex(({ value }) => {
      // 無 sort 的選項(例如「預設」)攤平後不帶 sort,只比對 key
      return value?.key === key && (value.sort === undefined || value.sort === sort)
    })

    if (index < 0) return false

    activeIndex.value = index
    activeSortType.value = null

    return true
  }

  const index = normalizedOptions.value.findIndex((item) => item.value === key)

  if (index < 0) return false

  const item = normalizedOptions.value[index]

  activeIndex.value = index
  activeSortType.value = item.sort ? (item.sort.asc.value === sort ? 'asc' : 'desc') : null

  return true
}

const onSyncActiveIndex = () => {
  const { index, active } = sortConfig.value

  if (active?.key != null && onSyncActiveBySort(active)) return

  activeIndex.value = index === null || index === undefined ? null : Number(index)
  activeSortType.value = null
}

const onCreateSortOption = (item, sortType) => {
  const reverseSortType = sortType === 'desc' ? 'asc' : 'desc'

  return {
    label: `${item.label} ${item.sort[sortType].label} - ${item.sort[reverseSortType].label}`,
    value: {
      key: item.value,
      sort: item.sort[sortType].value,
    },
  }
}

const onSetSortOptions = () => {
  if (currentMode.value === 'dropdown') {
    sortOptions.value = normalizedOptions.value.flatMap((item) => {
      if (!item.sort) {
        return [
          {
            label: item.label,
            value: {
              key: item.value,
            },
          },
        ]
      }

      return [
        {
          label: `${item.label} ${item.sort.asc.label} - ${item.sort.desc.label}`,
          value: {
            key: item.value,
            sort: item.sort.asc.value,
          },
        },
        {
          label: `${item.label} ${item.sort.desc.label} - ${item.sort.asc.label}`,
          value: {
            key: item.value,
            sort: item.sort.desc.value,
          },
        },
      ]
    })

    return
  }

  sortOptions.value = normalizedOptions.value
}

const onDropdownOpen = async () => {
  const $element = selectAnchorRef.value
  const $dropdown = dropdownRef.value

  if (!$element || !$dropdown) return

  const { maxItems, position } = sortConfig.value
  const items = Array.isArray(dropdownItemRef.value)
    ? dropdownItemRef.value
    : dropdownItemRef.value
      ? [dropdownItemRef.value]
      : []
  const hasItemsThanMax = maxItems <= items.length - 1
  const index = !hasItemsThanMax ? items.length - 1 : maxItems
  const $item = items[index]
  const itemHeight = $item
    ? hasItemsThanMax
      ? $item.offsetTop
      : $item.offsetTop + $item.offsetHeight
    : $dropdown.scrollHeight
  const rect = $element.getBoundingClientRect()
  const dropdownRect = $dropdown.getBoundingClientRect()
  const dropdownWidth = dropdownRect.width < rect.width ? rect.width : dropdownRect.width
  const bodyWidth = document.body.scrollWidth
  const isFixed = isFixedElement($element)
  const left = (() => {
    if (position === 'left') return rect.left
    if (position === 'right') return rect.left + rect.width - dropdownWidth

    const alignLeft =
      rect.left + dropdownWidth <= bodyWidth || rect.left + rect.width - dropdownWidth < 0

    return alignLeft ? rect.left : rect.left + rect.width - dropdownWidth
  })()

  $dropdown.style.position = isFixed ? 'fixed' : 'absolute'
  $dropdown.style.top = `${rect.top + rect.height + (isFixed ? 0 : window.scrollY)}px`
  $dropdown.style.left = `${left + (isFixed ? 0 : window.scrollX)}px`
  $dropdown.style.minWidth = `${rect.width}px`
  $dropdown.style.height = `${itemHeight}px`
  $dropdown.style.overflowX = 'hidden'
  $dropdown.style.overflowY = hasItemsThanMax ? 'auto' : ''
}

const onToggleDropdown = async () => {
  isActive.value = !isActive.value

  await nextTick()
  onDropdownOpen()
}

const onCloseDropdown = () => {
  isActive.value = false
}

const onButtonClick = (item, index) => {
  const isSameItem = activeIndex.value === index

  if (isSameItem && !item.sort) return

  activeIndex.value = index

  if (!item.sort) {
    activeSortType.value = null
    emits('click', item)
    return
  }

  activeSortType.value = isSameItem && activeSortType.value === 'desc' ? 'asc' : 'desc'
  emits('click', onCreateSortOption(item, activeSortType.value))
}

const onDropdownItemClick = (item, index) => {
  if (activeIndex.value === index) {
    onCloseDropdown()
    return
  }

  activeIndex.value = index
  activeSortType.value = null

  onCloseDropdown()
  emits('click', item)
}

const onOutSide = (e) => {
  const $element = selectAnchorRef.value
  const $dropdown = dropdownRef.value
  const isElementContains = $element ? $element.contains(e.target) : false
  const isDropdownContains = $dropdown ? $dropdown.contains(e.target) : false

  if (!isElementContains && !isDropdownContains) {
    onCloseDropdown()
  }
}

const onSortResize = () => {
  currentMode.value = resolveResponsiveConfig(sortConfig.value.mode) || defaultConfig.mode

  onSetSortOptions()
  // 切換模式會重排 sortOptions(dropdown 會攤平),選中的索引得跟著重算
  onSyncActiveIndex()
}

const onWindowResize = async () => {
  onResize()
  onSortResize()

  await nextTick()
  onDropdownOpen()
}

watch(
  () => [props.options, sortConfig.value.mode],
  () => {
    onSortResize()
  },
  {
    deep: true,
  }
)

watch(
  () => [sortConfig.value.index, sortConfig.value.active],
  () => {
    onSyncActiveIndex()
  },
  {
    deep: true,
  }
)

onResize()
// onSortResize 內會 onSyncActiveIndex,順序不能顛倒 —— 反查需要 sortOptions 先備妥
onSortResize()

onMounted(() => {
  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onWindowResize)
})
</script>

<template>
  <div class="m-sort">
    <ul class="m-sort-list" v-if="currentMode === 'button'">
      <li
        class="m-sort-item"
        v-for="(item, index) in sortOptions"
        :key="`sort_button_${item.value}_${index}`"
      >
        <button
          type="button"
          class="m-sort-anchor"
          :class="{
            '--active': activeIndex === index,
            '--asc': activeIndex === index && activeSortType === 'asc',
            '--desc': activeIndex === index && activeSortType === 'desc',
          }"
          @click="onButtonClick(item, index)"
        >
          <em class="m-sort-label">{{ item.label }}</em>
          <CommonSvgIcon icon="caret_large_down" class="m-sort-icon" v-if="item.sort" />
        </button>
      </li>
    </ul>

    <button
      type="button"
      class="m-sort-select-anchor"
      :class="{
        '--active': isActive,
      }"
      ref="selectAnchorRef"
      @click="onToggleDropdown"
      v-if="currentMode === 'dropdown'"
    >
      <em class="m-sort-select-label">{{ dropdownLabel }}</em>
      <CommonSvgIcon icon="caret_large_down" class="m-sort-select-icon" />
    </button>
  </div>
  <template v-if="currentMode === 'dropdown'">
    <Teleport to="body">
      <Transition name="dropdown" @afterLeave="onCloseDropdown" appear>
        <div class="m-sort-dropdown" ref="dropdownRef" v-if="isActive && sortOptions.length > 0">
          <ul class="m-sort-dropdown-list scrollbar --y">
            <li
              class="m-sort-dropdown-item"
              v-for="(item, index) in sortOptions"
              :key="`sort_dropdown_${item.value.key}_${item.value.sort || 0}_${index}`"
              ref="dropdownItemRef"
            >
              <button
                type="button"
                class="m-sort-dropdown-anchor"
                :class="{
                  '--active': activeIndex === index,
                }"
                @click="onDropdownItemClick(item, index)"
              >
                {{ item.label }}
              </button>
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </template>
</template>
