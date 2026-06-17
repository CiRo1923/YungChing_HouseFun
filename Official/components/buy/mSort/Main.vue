<script setup>
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

<style lang="postcss">
:root {
  --sort-list-pc-gap-x: 16px;
  --sort-list-tablet-gap-x: 16px;
  --sort-list-mobile-gap-x: 16px;

  --sort-anchor-pc-text: 14px;
  --sort-anchor-tablet-text: 14px;
  --sort-anchor-mobile-text: 14px;

  --sort-anchor-pc-gap-x: 5px;
  --sort-anchor-tablet-gap-x: 5px;
  --sort-anchor-mobile-gap-x: 5px;

  --sort-icon-pc-p: 2px;
  --sort-icon-tablet-p: 2px;
  --sort-icon-mobile-p: 2px;

  --sort-icon-pc-size: 14px;
  --sort-icon-tablet-size: 14px;
  --sort-icon-mobile-size: 14px;

  --sort-select-anchor-pc-text: 14px;
  --sort-select-anchor-tablet-text: 14px;
  --sort-select-anchor-mobile-text: 14px;

  --sort-select-anchor-pc-gap-x: 5px;
  --sort-select-anchor-tablet-gap-x: 5px;
  --sort-select-anchor-mobile-gap-x: 5px;

  --sort-select-icon-pc-p: 2px;
  --sort-select-icon-tablet-p: 2px;
  --sort-select-icon-mobile-p: 2px;

  --sort-select-icon-pc-size: 14px;
  --sort-select-icon-tablet-size: 14px;
  --sort-select-icon-mobile-size: 14px;

  --sort-dropdown-pc-my: 10px;
  --sort-dropdown-tablet-my: 10px;
  --sort-dropdown-mobile-my: 10px;

  --sort-dropdown-pc-rounded: 10px;
  --sort-dropdown-tablet-rounded: 10px;
  --sort-dropdown-mobile-rounded: 10px;

  --sort-dropdown-container-pc-py: 10px;
  --sort-dropdown-container-tablet-py: 10px;
  --sort-dropdown-container-mobile-py: 10px;

  --sort-dropdown-list-pc-gap-y: 5px;
  --sort-dropdown-list-tablet-gap-y: 5px;
  --sort-dropdown-list-mobile-gap-y: 5px;

  --sort-dropdown-item-pc-px: 0;
  --sort-dropdown-item-tablet-px: 0;
  --sort-dropdown-item-mobile-px: 0;

  --sort-dropdown-anchor-pc-px: 8px;
  --sort-dropdown-anchor-tablet-px: 8px;
  --sort-dropdown-anchor-mobile-px: 8px;

  --sort-dropdown-anchor-pc-py: 8px;
  --sort-dropdown-anchor-tablet-py: 8px;
  --sort-dropdown-anchor-mobile-py: 8px;

  --sort-dropdown-anchor-pc-text: 14px;
  --sort-dropdown-anchor-tablet-text: 14px;
  --sort-dropdown-anchor-mobile-text: 14px;

  --sort-dropdown-anchor-pc-border-b: 0;
  --sort-dropdown-anchor-tablet-border-b: 0;
  --sort-dropdown-anchor-mobile-border-b: 0;

  --sort-dropdown-anchor-pc-gap-x: 5px;
  --sort-dropdown-anchor-tablet-gap-x: 5px;
  --sort-dropdown-anchor-mobile-gap-x: 5px;

  --sort-dropdown-anchor-icon-pc-p: 2px;
  --sort-dropdown-anchor-tablet-p: 2px;
  --sort-dropdown-anchor-mobile-p: 2px;

  --sort-dropdown-anchor-icon-pc-size: 20px;
  --sort-dropdown-anchor-icon-tablet-size: 20px;
  --sort-dropdown-anchor-icon-mobile-size: 20px;

  --sort-anchor-color: var(--gray-666);
  --sort-anchor-hover-color: var(--orange-e646);
  --sort-anchor-active-color: var(--orange-e646);

  --sort-dropdown-bg-color: var(--white);
  --sort-dropdown-anchor-color: var(--gray-333);
  --sort-dropdown-anchor-hover-color: var(--green-8b0d);
  --sort-dropdown-anchor-active-color: var(--white);
  --sort-dropdown-anchor-bg-color: tranparent;
  --sort-dropdown-anchor-hover-bg-color: tranparent;
  --sort-dropdown-anchor-active-bg-color: var(--green-8b0d);
  --sort-dropdown-anchor-border-b-color: var(--gray-e5);
}

.m-sort-list {
  @apply gap-x-[--sort-list-gap-x];
}

.m-sort-anchor {
  font-size: var(--sort-anchor-text);

  @apply gap-x-[--sort-anchor-gap-x];

  &:hover {
    @apply text-[--sort-anchor-hover-color];
  }

  &:not(:hover):not(.\-\-active) {
    @apply text-[--sort-anchor-color];
  }

  &.\-\-active {
    @apply text-[--sort-anchor-active-color];
  }

  &.\-\-asc {
    .m-sort-icon {
      @apply -rotate-180;
    }
  }
}

.m-sort-icon {
  @apply h-[--sort-icon-size] w-[--sort-icon-size] p-[--sort-icon-p];
}

.m-sort-select-anchor {
  font-size: var(--sort-select-anchor-text);

  @apply gap-x-[--sort-select-anchor-gap-x] text-[--sort-anchor-color];

  &.\-\-active {
    .m-sort-select-icon {
      @apply -rotate-180;
    }
  }
}

.m-sort-select-icon {
  @apply h-[--sort-select-icon-size] w-[--sort-select-icon-size] p-[--sort-select-icon-p];
}

.m-sort-dropdown {
  @apply my-[--sort-dropdown-my] rounded-[--sort-dropdown-rounded] bg-[--sort-dropdown-bg-color] shadow-dropdown;

  &.\-\-scrollbar {
    @apply pr-[2px];

    .m-sort-dropdown-container {
      @apply pr-[2px];
    }
  }
}

.m-sort-dropdown-container {
  border-top-width: var(--sort-dropdown-container-py);
  border-bottom-width: var(--sort-dropdown-container-py);

  @apply border-solid border-y-transparent;
}

.m-sort-dropdown-list {
  @apply space-y-[--sort-dropdown-list-gap-y];
}

.m-sort-dropdown-item {
  @apply px-[--sort-dropdown-item-px];

  &:not(:last-child) {
    .m-sort-dropdown-anchor {
      &:after {
        @apply absolute bottom-0 block h-[--sort-dropdown-anchor-border-b] w-full bg-[--sort-dropdown-anchor-border-b-color] content-default;
      }
    }
  }
}

.m-sort-dropdown-anchor {
  font-size: var(--sort-dropdown-anchor-text);

  @apply gap-x-[--sort-dropdown-anchor-gap-x] px-[--sort-dropdown-anchor-px] py-[--sort-dropdown-anchor-py];

  &:hover {
    @apply bg-[--sort-dropdown-anchor-hover-bg-color] text-[--sort-dropdown-anchor-hover-color];
  }

  &:not(:hover):not(.\-\-active) {
    @apply bg-[--sort-dropdown-anchor-bg-color] text-[--sort-dropdown-anchor-color];
  }

  &.\-\-active {
    @apply bg-[--sort-dropdown-anchor-active-bg-color] text-[--sort-dropdown-anchor-active-color];
  }
}

.m-sort-dropdown-anchor-icon {
  @apply h-[--sort-dropdown-anchor-icon-size] w-[--sort-dropdown-anchor-icon-size] p-[--sort-dropdown-anchor-icon-p];
}

@screen p {
  .m-sort {
    --sort-list-gap-x: var(--sort-list-pc-gap-x);
    --sort-anchor-text: var(--sort-anchor-pc-text);
    --sort-anchor-gap-x: var(--sort-anchor-pc-gap-x);
    --sort-icon-p: var(--sort-icon-pc-p);
    --sort-icon-size: var(--sort-icon-pc-size);
    --sort-select-anchor-text: var(--sort-select-anchor-pc-text);
    --sort-select-anchor-gap-x: var(--sort-select-anchor-pc-gap-x);
    --sort-select-icon-p: var(--sort-select-icon-pc-p);
    --sort-select-icon-size: var(--sort-select-icon-pc-size);
  }

  .m-sort-dropdown {
    --sort-dropdown-my: var(--sort-dropdown-pc-my);
    --sort-dropdown-rounded: var(--sort-dropdown-pc-rounded);
    --sort-dropdown-container-py: var(--sort-dropdown-container-pc-py);
    --sort-dropdown-list-gap-y: var(--sort-dropdown-list-pc-gap-y);
    --sort-dropdown-item-px: var(--sort-dropdown-item-pc-px);
    --sort-dropdown-anchor-px: var(--sort-dropdown-anchor-pc-px);
    --sort-dropdown-anchor-py: var(--sort-dropdown-anchor-pc-py);
    --sort-dropdown-anchor-text: var(--sort-dropdown-anchor-pc-text);
    --sort-dropdown-anchor-border-b: var(--sort-dropdown-anchor-pc-border-b);
    --sort-dropdown-anchor-gap-x: var(--sort-dropdown-anchor-pc-gap-x);
    --sort-dropdown-anchor-icon-p: var(--sort-dropdown-anchor-icon-pc-p);
    --sort-dropdown-anchor-icon-size: var(--sort-dropdown-anchor-icon-pc-size);
  }
}

@screen t {
  .m-sort {
    --sort-list-gap-x: var(--sort-list-tablet-gap-x);
    --sort-anchor-text: var(--sort-anchor-tablet-text);
    --sort-anchor-gap-x: var(--sort-anchor-tablet-gap-x);
    --sort-icon-p: var(--sort-icon-tablet-p);
    --sort-icon-size: var(--sort-icon-tablet-size);
    --sort-select-anchor-text: var(--sort-select-anchor-tablet-text);
    --sort-select-anchor-gap-x: var(--sort-select-anchor-tablet-gap-x);
    --sort-select-icon-p: var(--sort-select-icon-tablet-p);
    --sort-select-icon-size: var(--sort-select-icon-tablet-size);
  }

  .m-sort-dropdown {
    --sort-dropdown-my: var(--sort-dropdown-tablet-my);
    --sort-dropdown-rounded: var(--sort-dropdown-tablet-rounded);
    --sort-dropdown-container-py: var(--sort-dropdown-container-tablet-py);
    --sort-dropdown-list-gap-y: var(--sort-dropdown-list-tablet-gap-y);
    --sort-dropdown-item-px: var(--sort-dropdown-item-tablet-px);
    --sort-dropdown-anchor-px: var(--sort-dropdown-anchor-tablet-px);
    --sort-dropdown-anchor-py: var(--sort-dropdown-anchor-tablet-py);
    --sort-dropdown-anchor-text: var(--sort-dropdown-anchor-tablet-text);
    --sort-dropdown-anchor-border-b: var(--sort-dropdown-anchor-tablet-border-b);
    --sort-dropdown-anchor-gap-x: var(--sort-dropdown-anchor-tablet-gap-x);
    --sort-dropdown-anchor-icon-p: var(--sort-dropdown-anchor-icon-tablet-p);
    --sort-dropdown-anchor-icon-size: var(--sort-dropdown-anchor-icon-tablet-size);
  }
}

@screen m {
  .m-sort {
    --sort-list-gap-x: var(--sort-list-mobile-gap-x);
    --sort-anchor-text: var(--sort-anchor-mobile-text);
    --sort-anchor-gap-x: var(--sort-anchor-mobile-gap-x);
    --sort-icon-p: var(--sort-icon-mobile-p);
    --sort-icon-size: var(--sort-icon-mobile-size);
    --sort-select-anchor-text: var(--sort-select-anchor-mobile-text);
    --sort-select-anchor-gap-x: var(--sort-select-anchor-mobile-gap-x);
    --sort-select-icon-p: var(--sort-select-icon-mobile-p);
    --sort-select-icon-size: var(--sort-select-icon-mobile-size);
  }

  .m-sort-dropdown {
    --sort-dropdown-my: var(--sort-dropdown-mobile-my);
    --sort-dropdown-rounded: var(--sort-dropdown-mobile-rounded);
    --sort-dropdown-container-py: var(--sort-dropdown-container-mobile-py);
    --sort-dropdown-list-gap-y: var(--sort-dropdown-list-mobile-gap-y);
    --sort-dropdown-item-px: var(--sort-dropdown-item-mobile-px);
    --sort-dropdown-anchor-px: var(--sort-dropdown-anchor-mobile-px);
    --sort-dropdown-anchor-py: var(--sort-dropdown-anchor-mobile-py);
    --sort-dropdown-anchor-text: var(--sort-dropdown-anchor-mobile-text);
    --sort-dropdown-anchor-border-b: var(--sort-dropdown-anchor-mobile-border-b);
    --sort-dropdown-anchor-gap-x: var(--sort-dropdown-anchor-mobile-gap-x);
    --sort-dropdown-anchor-icon-p: var(--sort-dropdown-anchor-icon-mobile-p);
    --sort-dropdown-anchor-icon-size: var(--sort-dropdown-anchor-icon-mobile-size);
  }
}
</style>
