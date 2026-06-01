<script setup>
import { onMergeDropdownConfig, useDropdownCore } from './.composables/useDropdownCore.js'
import SelectDropdownOptions from './SelectDropdownOptions.vue'

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
const dropdownBodyRefs = ref([])
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
    dropdownOption: {
      type: 'multiple',
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
      dropdownBody: '',
      dropdownOptions: '',
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

const onSetDropdownBodyRef = (el, index) => {
  dropdownBodyRefs.value[index] = el
}

const onGetDropdownOptionOffset = (dataIndex) => {
  return dropdownDatas.value
    .slice(0, dataIndex)
    .reduce((total, data) => total + data.options.length, 0)
}

const onSetDropdownItemRef = (el, index) => {
  if (!Array.isArray(dropdownItemRef.value)) {
    dropdownItemRef.value = []
  }

  dropdownItemRef.value[index] = el
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

  dropdownBodyRefs.value.forEach(($body) => {
    if (!$body) return

    $body.style.height = ''

    const $options = $body.querySelector('.m-form-dropdown-options')
    if (!$options) return

    const items = Array.from($options.children || [])
    const hasItemsThanMax = maxItems && items.length > maxItems

    if (!hasItemsThanMax) return

    const optionsStyle = getComputedStyle($options)
    const gapY = parseFloat(optionsStyle.rowGap) || 0
    const visibleItemsHeight = items
      .slice(0, maxItems)
      .reduce((total, item) => total + item.getBoundingClientRect().height, 0)
    const visibleItemsGapHeight = Math.max(maxItems - 1, 0) * gapY

    $body.style.height = `${visibleItemsHeight + visibleItemsGapHeight}px`
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

const onIsDropdownOptionActive = (data, item) => {
  return onIsSelected(data, item)
}

const onGetDropdownOptionKey = (data, item, index) => {
  return item?.[onGetSchema(data).value] ?? `${data.dataIndex}_${index}`
}

const onGetDropdownOptionConfig = (data) => {
  return {
    ...config.value,
    schema: onGetSchema(data),
  }
}

const onDropdownOptionClick = (dataIndex, item) => {
  onDropdownItemClick(dataIndex, item)
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
          class="m-form-dropdown-container"
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
              <div
                class="m-form-dropdown-body scrollbar --y"
                :class="setClass.dropdownBody"
                :ref="(el) => onSetDropdownBodyRef(el, dataIndex)"
              >
                <SelectDropdownOptions
                  :options="data.options"
                  :config="onGetDropdownOptionConfig(data)"
                  :setClass="setClass"
                  :isActiveOption="(item) => onIsDropdownOptionActive(data, item)"
                  :onItemClick="(item) => onDropdownOptionClick(dataIndex, item)"
                  :itemRef="onSetDropdownItemRef"
                  :itemRefIndexOffset="onGetDropdownOptionOffset(dataIndex)"
                  :getKey="(item, index) => onGetDropdownOptionKey(data, item, index)"
                >
                  <template #option="{ item, index, isOptionActive }">
                    <slot
                      name="option"
                      :item="item"
                      :index="index"
                      :isOptionActive="isOptionActive"
                    >
                      {{ item[onGetSchema(data).label] }}
                    </slot>
                  </template>
                </SelectDropdownOptions>
              </div>
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
<style lang="postcss">
@import '@css/_common/vueTransition.css';
</style>
