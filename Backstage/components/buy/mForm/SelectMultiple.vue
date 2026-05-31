<script setup>
import { onMergeDropdownConfig, useDropdownCore } from './.composables/useDropdownCore.js'

const props = defineProps({
  items: {
    type: Array,
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

const selectedIndex = ref(-1)
const dropdownOptionsRef = ref([])
const onGetRefValue = (source) => {
  return isRef(source) ? source.value : source
}

const onSetRefValue = (source, value) => {
  if (isRef(source)) {
    source.value = value
  }
}

const onGetRawData = (dataIndex) => {
  return toRaw(props.items)?.[dataIndex] || props.items[dataIndex] || {}
}

const config = computed(() => {
  const defaultConfig = {
    maxItems: null,
    schema: {
      label: 'label',
      value: 'value',
      isDisabled: 'isDisabled',
    },
  }

  return onMergeDropdownConfig(props.config, defaultConfig)
})
const coreConfig = computed(() => {
  return {
    ...config.value,
    maxItem: null,
    maxItems: null,
  }
})
const dropdownDatas = computed(() => {
  return props.items.map((data = {}, dataIndex) => {
    const rawData = onGetRawData(dataIndex)
    const options =
      onGetRefValue(rawData.options || rawData.optiosn || data.options || data.optiosn) || []
    const modelRef = rawData.model || data.model
    const model = onGetRefValue(modelRef)

    return {
      ...data,
      dataIndex,
      options,
      modelRef,
      model,
    }
  })
})
const options = computed(() => {
  return dropdownDatas.value.flatMap((data) => data.options)
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      icon: '',
      dropdown: '',
      dropdownContainer: '',
      dropdownButton: '',
    },
    ...props.setClass,
  }
})

const {
  elenemtRef,
  dropdownRef,
  dropdownContainerRef,
  dropdownItemRef,
  isActive,
  isFocus,
  isOpen,
  onSwitchActive,
  onCloseDropdown,
  onDropdownOpen: onCoreDropdownOpen,
  onElementClick: onCoreElementClick,
  onSelectResize: onCoreSelectResize,
  isDropdownOutside,
} = useDropdownCore({
  config: coreConfig,
  options,
  selectedIndex,
})

const onGetMaxItems = () => {
  const maxItemsNumber = Number(config.value.maxItems ?? config.value.maxItem)

  return Number.isFinite(maxItemsNumber) && maxItemsNumber > 0 ? Math.floor(maxItemsNumber) : null
}

const onSetDropdownOptionsRef = (el, index) => {
  dropdownOptionsRef.value[index] = el
}

const onDropdownHeightUpdate = () => {
  const $dropdown = dropdownRef.value
  const $dropdownContainer = dropdownContainerRef.value

  if (!$dropdown || !$dropdownContainer) return

  const containerStyle = getComputedStyle($dropdownContainer)
  const containerBorderHeight =
    (parseFloat(containerStyle.borderTopWidth) || 0) +
    (parseFloat(containerStyle.borderBottomWidth) || 0)

  $dropdown.style.height = `${$dropdownContainer.scrollHeight + containerBorderHeight}px`
}

const onDropdownOptionsOpen = () => {
  const maxItems = onGetMaxItems()

  dropdownOptionsRef.value.forEach(($options) => {
    if (!$options) return

    $options.style.height = ''

    const items = Array.from($options.children || [])
    const hasItemsThanMax = maxItems && items.length > maxItems

    if (!hasItemsThanMax) return

    const optionsStyle = getComputedStyle($options)
    const gapY = parseFloat(optionsStyle.rowGap) || 0
    const visibleItemsHeight = items
      .slice(0, maxItems)
      .reduce((total, item) => total + item.getBoundingClientRect().height, 0)
    const visibleItemsGapHeight = Math.max(maxItems - 1, 0) * gapY

    $options.style.height = `${visibleItemsHeight + visibleItemsGapHeight}px`
  })

  onDropdownHeightUpdate()
}

const onDropdownOpen = () => {
  onCoreDropdownOpen()
  onDropdownOptionsOpen()
}

const onElementClick = async () => {
  await onCoreElementClick()
  await nextTick()
  onDropdownOptionsOpen()
}

const onSelectResize = async () => {
  onCoreSelectResize()
  await nextTick()
  onDropdownOptionsOpen()
}

const onOutSide = (e) => {
  if (isDropdownOutside(e)) {
    onSwitchActive(false)
  }
}

const onGetSchema = (data) => {
  return {
    ...config.value.schema,
    ...(onGetRefValue(data?.schema) || {}),
  }
}

const onGetOptionValue = (data, option) => {
  const schema = onGetSchema(data)

  return option?.[schema.value]
}

const onIsSelected = (data, option) => {
  const value = onGetOptionValue(data, option)

  return data.model == value
}

const onDropdownItemClick = (dataIndex, option) => {
  const modelRef = onGetRawData(dataIndex).model

  if (!isRef(modelRef)) return

  const data = dropdownDatas.value[dataIndex]
  const value = onGetOptionValue(data, option)

  onSetRefValue(modelRef, value)
}

defineExpose({
  elenemtRef,
  dropdownRef,
  dropdownContainerRef,
  dropdownItemRef,
  isActive,
  isFocus,
  isOpen,
  onSwitchActive,
  onDropdownOpen,
  onElementClick,
  onSelectResize,
  isDropdownOutside,
})

onMounted(() => {
  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onSelectResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onSelectResize)
})
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
    <div class="m-form-container flex" :class="setClass.container">
      <button
        type="button"
        class="m-form-element --select"
        :class="[
          setClass.element,
          {
            '--focus': isFocus,
          },
        ]"
        :disabled="config.isDisabled"
        ref="elenemtRef"
        @click="onElementClick()"
      >
        <div class="m-form-type" :class="setClass.type">
          <slot />
        </div>
        <CommonSvgIcon
          icon="caret_large_down"
          class="m-form-icon"
          :class="setClass.icon"
          v-if="config.arrowType === 'caret'"
        />
        <i class="m-form-icon-arrow" v-if="config.arrowType === 'arrow'" />
      </button>
    </div>
  </div>
  <Teleport to="body">
    <Transition name="dropdown" @before-leave="onCloseDropdown" appear>
      <div
        class="m-form-dropdown --dropdown"
        :class="[setClass.dropdown, { '--open': isOpen }]"
        ref="dropdownRef"
        v-if="isActive && !config.isDisabled"
      >
        <div
          class="m-form-dropdown-container scrollbar --y"
          :class="setClass.dropdownContainer"
          ref="dropdownContainerRef"
        >
          <div class="m-form-dropdown-datas flex w-full">
            <div
              class="m-form-dropdown-data min-w-0 flex-1"
              v-for="(data, dataIndex) in dropdownDatas"
              :key="data.key || data.name || dataIndex"
            >
              <div class="m-form-dropdown-header" v-if="$slots.dropdownHeader">
                <slot name="dropdownHeader" :data="data" />
              </div>
              <ul
                class="m-form-dropdown-options scrollbar --y"
                :ref="(el) => onSetDropdownOptionsRef(el, dataIndex)"
              >
                <li
                  class="m-form-dropdown-item"
                  v-for="(item, index) in data.options"
                  :key="item?.[onGetSchema(data).value] ?? `${dataIndex}_${index}`"
                  ref="dropdownItemRef"
                >
                  <button
                    type="button"
                    class="m-form-dropdown-button"
                    :class="[
                      setClass.dropdownButton,
                      {
                        '--active': onIsSelected(data, item),
                      },
                    ]"
                    :disabled="item[onGetSchema(data).isDisabled] === true"
                    @click="onDropdownItemClick(dataIndex, item)"
                  >
                    <CommonSvgIcon
                      icon="icon_check_solid"
                      class="m-form-dropdown-icon"
                      v-if="onIsSelected(data, item)"
                    />
                    <em class="m-form-dropdown-label">
                      <slot name="option" :item="item">
                        {{ item[onGetSchema(data).label] }}
                      </slot>
                    </em>
                  </button>
                </li>
              </ul>
              <footer class="m-form-dropdown-footer" v-if="$slots.dropdownFooter">
                <slot name="dropdownFooter" :data="data" />
              </footer>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style src="@css/_modules/buy/mFormDropdown.css"></style>
<style lang="postcss"></style>
