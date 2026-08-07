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
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const defaultConfig = {
  mode: 'button',
  index: null,
  symbol: '-',
  maxItems: 5,
  position: 'auto',
}

const sortConfig = computed(() => ({
  ...defaultConfig,
  ...props.config,
}))

const mode = ref('button')
const sortOptions = ref([])
const isActive = ref(false)
const hasScrollbar = ref(false)
const activeIndex = ref(null)
const activeSortType = ref(null)
const selectAnchorRef = ref(null)
const dropdownRef = ref(null)
const dropdownContainerRef = ref(null)
const dropdownItemRef = ref(null)

const normalizedOptions = computed(() => {
  if (Array.isArray(props.options)) return props.options
  return Object.values(props.options || {})
})

const dropdownLabel = computed(() => {
  return sortOptions.value[activeIndex.value]?.label || sortOptions.value[0]?.label || ''
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
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

const onSyncActiveIndex = () => {
  const { index } = sortConfig.value

  activeIndex.value = index === null || index === undefined ? null : Number(index)
  activeSortType.value = null
}

const onCreateSortOption = (item, sortType) => {
  const reverseSortType = sortType === 'desc' ? 'asc' : 'desc'
  const reverseLabel = item.sort[reverseSortType]?.label
    ? ` - ${item.sort[reverseSortType].label}`
    : ''

  return {
    label: `${item.label} ${item.sort[sortType].label}${reverseLabel}`,
    value: {
      key: item.value,
      sort: item.sort[sortType].value,
    },
  }
}

const onSetSortOptions = () => {
  const { symbol } = sortConfig.value
  if (mode.value === 'dropdown') {
    sortOptions.value = normalizedOptions.value.flatMap((item) => {
      const hasSortDirections = item.sort && typeof item.sort === 'object'

      if (!hasSortDirections) {
        return [
          {
            label: item.label,
            value: {
              key: item.value,
              ...(item.sort != null ? { sort: item.sort } : {}),
            },
          },
        ]
      }

      return ['asc', 'desc']
        .filter((sortType) => item.sort[sortType]?.value)
        .map((sortType) => {
          const reverseSortType = sortType === 'desc' ? 'asc' : 'desc'
          const reverseLabel = item.sort[reverseSortType]?.label
            ? `${symbol}${item.sort[reverseSortType].label}`
            : ''

          return {
            label: `${item.label} ${item.sort[sortType].label}${reverseLabel}`,
            value: {
              key: item.value,
              sort: item.sort[sortType].value,
            },
          }
        })
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
  hasScrollbar.value = hasItemsThanMax
  const index = !hasItemsThanMax ? items.length - 1 : maxItems
  const $item = items[index]
  const $container = dropdownContainerRef.value
  // offsetTop 是相對於有定位的 $dropdown，已包含 container 的 top border，
  // 但未涵蓋 container 的 bottom border，需另外補上避免高度短少而裁切。
  const containerBorderBottom = $container
    ? parseFloat(window.getComputedStyle($container).borderBottomWidth) || 0
    : 0
  const itemHeight =
    ($item
      ? hasItemsThanMax
        ? $item.offsetTop
        : $item.offsetTop + $item.offsetHeight
      : $dropdown.scrollHeight) + containerBorderBottom
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

  // 捲動交給內層 container（它才有 .scrollbar 樣式）。
  // 動畫期間先維持 hidden，避免 height 動畫過程中閃出原生捲軸，
  // 待 enter 動畫結束後（onDropdownAfterEnter）才開啟 auto。
  if ($container) {
    $container.style.overflowX = 'hidden'
    $container.style.overflowY = 'hidden'
  }
}

const onDropdownAfterEnter = () => {
  const $container = dropdownContainerRef.value

  if (!$container) return

  $container.style.overflowY = hasScrollbar.value ? 'auto' : 'hidden'
}

const onDropdownBeforeLeave = () => {
  const $container = dropdownContainerRef.value

  if (!$container) return

  $container.style.overflowY = 'hidden'
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
  const hasSortDirections = item.sort && typeof item.sort === 'object'

  if (isSameItem && !hasSortDirections) return

  activeIndex.value = index

  if (!hasSortDirections) {
    activeSortType.value = null
    emits('click', {
      label: item.label,
      value: {
        key: item.value,
        ...(item.sort != null ? { sort: item.sort } : {}),
      },
    })
    return
  }

  const sortTypes = ['desc', 'asc'].filter((sortType) => item.sort[sortType]?.value)

  if (!sortTypes.length) {
    activeSortType.value = null
    emits('click', { label: item.label, value: { key: item.value } })
    return
  }

  activeSortType.value =
    isSameItem && activeSortType.value === sortTypes[0] && sortTypes[1]
      ? sortTypes[1]
      : sortTypes[0]

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
  mode.value = resolveResponsiveConfig(sortConfig.value.mode) || defaultConfig.mode

  onSetSortOptions()
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
  () => sortConfig.value.index,
  () => {
    onSyncActiveIndex()
  }
)

onSyncActiveIndex()
onResize()
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
  <div class="m-sort" :class="setClass.main">
    <!-- 模式為攤平按鈕 -->
    <ul class="m-sort-list flex items-center" v-if="mode === 'button'">
      <li
        class="m-sort-item"
        v-for="(item, index) in sortOptions"
        :key="`sort_button_${item.value}_${index}`"
      >
        <button
          type="button"
          class="m-sort-anchor flex items-center transition-colors duration-300"
          :class="{
            '--active': activeIndex === index,
            '--asc': activeIndex === index && activeSortType === 'asc',
            '--desc': activeIndex === index && activeSortType === 'desc',
          }"
          @click="onButtonClick(item, index)"
        >
          <em class="m-sort-label">{{ item.label }}</em>
          <CommonSvgIcon
            icon="caret_large_down"
            class="m-sort-icon transition-transform duration-300"
            v-if="item.sort"
          />
        </button>
      </li>
    </ul>

    <!-- 模式為下拉選單 -->
    <button
      type="button"
      class="m-sort-select-anchor flex items-center"
      :class="{
        '--active': isActive,
      }"
      ref="selectAnchorRef"
      @click="onToggleDropdown"
      v-if="mode === 'dropdown'"
    >
      <em class="m-sort-select-label">{{ dropdownLabel }}</em>
      <CommonSvgIcon
        icon="caret_large_down"
        class="m-sort-select-icon transition-transform duration-300"
      />
    </button>
  </div>
  <template v-if="mode === 'dropdown'">
    <Teleport to="body">
      <Transition
        name="dropdown"
        @afterEnter="onDropdownAfterEnter"
        @beforeLeave="onDropdownBeforeLeave"
        @afterLeave="onCloseDropdown"
        appear
      >
        <div
          class="m-sort-dropdown absolute z-[3] overflow-hidden"
          :class="{ '--scrollbar': hasScrollbar }"
          ref="dropdownRef"
          v-if="isActive && sortOptions.length > 0"
        >
          <div class="m-sort-dropdown-container scrollbar --y h-full" ref="dropdownContainerRef">
            <ul class="m-sort-dropdown-list">
              <li
                class="m-sort-dropdown-item"
                v-for="(item, index) in sortOptions"
                :key="`sort_dropdown_${item.value.key}_${item.value.sort || 0}_${index}`"
                ref="dropdownItemRef"
              >
                <button
                  type="button"
                  class="m-sort-dropdown-anchor relative flex w-full items-center text-left transition-colors duration-300"
                  :class="{
                    '--active': activeIndex === index,
                  }"
                  @click="onDropdownItemClick(item, index)"
                >
                  <CommonSvgIcon
                    icon="icon_check_solid"
                    class="m-sort-dropdown-anchor-icon transition-transform duration-300"
                    v-if="activeIndex === index"
                  />
                  <em>{{ item.label }}</em>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>
</template>

<style lang="postcss"></style>
