<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

import { onDevice, onDeepMerge, onDeepClone, emptyData } from '@js/_prototype.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number, Boolean, Object],
    default: null,
  },
  options: {
    type: [Array, Object],
    default: null,
  },
  config: {
    type: Object,
    default: () => {},
  },
  rules: {
    type: Object,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => {},
  },
})
const borderWidth = 0
const elenemtRef = ref(null)
const selectRef = ref(null)
const dropdownRef = ref(null)
const dropdownContainerRef = ref(null)
const dropdownItemRef = ref(null)
const device = ref(null)
const isFocus = ref(false)
const isActive = ref(false)
const selectedIndex = ref(-1)
const label = ref(null)
const model = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:modelValue', value)
  },
})
const config = computed(() => {
  const defaultConfig = {
    arrowType: 'caret',
    startOption: null,
    placeholder: null,
    isDisabled: false,
    isError: false,
    position: 'auto',
    // dropdownWidth: 'auto',
    schema: {
      label: 'label',
      value: 'value',
    },
    keyboard: false,
    maxItems: 5,
  }

  return onDeepMerge(defaultConfig, props.config)
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      suffix: '',
      error: '',
      dropdown: '',
      dropdownContainer: '',
    },
    ...props.setClass,
  }
})

const placeholder = computed(() => {
  const { placeholder } = config.value
  const isObject = placeholder && typeof placeholder !== 'string'

  return isObject
    ? placeholder
    : {
        value: placeholder,
        isToOption: false,
      }
})

const options = computed(() => {
  const { schema } = config.value
  const { value, isToOption } = placeholder.value
  const options = props.options ? onDeepClone(props.options) : []
  const placeholderItem = emptyData(onDeepClone(options[0]))

  if (isToOption) {
    placeholderItem[schema.label] = value
    placeholderItem[schema.value] = ''

    options.unshift(placeholderItem)
  }

  return options
})

const onSetSelectedIndex = () => {
  const { startOption } = config.value
  let index = -1

  if (options.value) {
    if (startOption) {
      index = options.value.findIndex((item) => item.value === startOption)
    } else {
      index = options.value.findIndex((item) => item[config.value.schema.value] === model.value)
    }

    // index = index === -1 ? 0 : index
    label.value = index !== -1 ? options.value[index][config.value.schema.label] : null
  }

  selectedIndex.value = index
}

const onSwitchActive = (value) => {
  isFocus.value = value !== undefined ? value : !isFocus.value
  isActive.value = value !== undefined ? value : !isActive.value
}

const onCloseDropdown = () => {
  onSwitchActive(false)
}

const onElementClick = async () => {
  onSwitchActive()

  await nextTick()
  onDropdownOpen()
}

const onDropdownOpen = () => {
  const { maxItems } = config.value
  const $elenemt = elenemtRef.value
  const $dropdown = dropdownRef.value
  const $dropdownContainer = dropdownContainerRef.value
  const element = {
    rect: elenemtRef.value.getBoundingClientRect(),
  }

  if ($elenemt && $dropdown && $dropdownContainer) {
    const hasItemsThanMax = maxItems <= dropdownItemRef.value.length - 1

    if (hasItemsThanMax) {
      $dropdownContainer.style.overflowY = 'auto'
    }

    const index = !hasItemsThanMax ? dropdownItemRef.value.length - 1 : maxItems
    const $item = dropdownItemRef.value ? dropdownItemRef.value[index] : null
    const dropdown = {
      rect: dropdownRef.value.getBoundingClientRect(),
    }
    const itemHeight = $item
      ? hasItemsThanMax
        ? $item.offsetTop
        : $item.offsetTop + $item.offsetHeight
      : 0

    const offsetTop = element.rect.height + element.rect.top + window.scrollY
    const offsetLeftMin = dropdown.rect.width + element.rect.left
    const dropdownWidth =
      dropdown.rect.width < element.rect.width ? element.rect.width : dropdown.rect.width
    const offsetLeftMax = element.rect.width + element.rect.left - dropdownWidth
    const bodyWidth = document.body.scrollWidth
    const left =
      ((offsetLeftMin > bodyWidth && offsetLeftMax < 0) || offsetLeftMin < bodyWidth) &&
      config.value.position !== 'right'
        ? element.rect.left
        : offsetLeftMax
    const maxHeight = itemHeight + borderWidth

    $dropdown.style.height = `${maxHeight}px`
    $dropdown.style.top = `${offsetTop - borderWidth * 2}px`
    $dropdown.style.left = `${left - borderWidth}px`

    if (dropdown.rect.width < element.rect.width) {
      $dropdown.style.minWidth = `${element.rect.width}px`
    }

    // console.log(dropdown.rect.width)

    // if (config.value.dropdownWidth !== 'auto') {
    //   $dropdown.style.maxWidth = `${config.value.dropdownWidth}px`
    // }
    if (model.value !== null && model.value !== '') {
      selectedIndex.value = options.value.findIndex(
        (item) => item[config.value.schema.value] === model.value
      )

      const $selectedItem = dropdownItemRef.value[selectedIndex.value]
      const selectedItem = {
        rect: $selectedItem.getBoundingClientRect(),
      }

      $dropdownContainer.scrollTop =
        $selectedItem.offsetTop + selectedItem.rect.height / 2 - maxHeight / 2
    }
  }
}

const onDropdownArrow = (e) => {
  const { code } = e

  e.preventDefault()

  if (config.value.keyboard && options.value.length > 0) {
    selectedIndex.value = code === 'ArrowDown' ? ++selectedIndex.value : --selectedIndex.value

    if (selectedIndex.value >= options.value.length) {
      selectedIndex.value = selectedIndex.value % options.value.length
    } else if (selectedIndex.value < 0) {
      selectedIndex.value = options.value.length - 1
    }

    const $dropdown = dropdownRef.value
    const $dropdownItemRef = dropdownItemRef.value[selectedIndex.value]
    const dropdown = {
      rect: dropdownRef.value.getBoundingClientRect(),
    }
    const dropdownItem = {
      rect: $dropdownItemRef.getBoundingClientRect(),
    }

    if (selectedIndex.value !== 0 && selectedIndex.value !== options.value.length - 1) {
      if (code === 'ArrowDown') {
        if ($dropdown.scrollTop + dropdown.rect.height <= $dropdownItemRef.offsetTop) {
          $dropdown.scrollTop = $dropdown.scrollTop + dropdownItem.rect.height
        }
      } else {
        if ($dropdown.scrollTop > $dropdownItemRef.offsetTop) {
          $dropdown.scrollTop = $dropdown.scrollTop - dropdownItem.rect.height
        }
      }
    } else {
      if (selectedIndex.value === 0) {
        $dropdown.scrollTop = 0
      } else {
        $dropdown.scrollTop =
          (options.value.length - config.value.maxItems) * dropdownItem.rect.height
      }
    }
    const result = options.value[selectedIndex.value]
    model.value = result[config.value.schema.value]
    label.value = result[config.value.schema.label]

    // emits('change', result)
  }
}

const onDropdownEnter = () => {
  const $selectRef = selectRef.value

  onSwitchActive(false)
  $selectRef.blur()
}

const onDropdownItemClick = (index) => {
  const { schema } = config.value
  const option = options.value[index]

  selectedIndex.value = index
  model.value = option[schema.value]
  label.value = option[schema.label]

  onSwitchActive(false)
  emits('change', option)
}

const onOutSide = (e) => {
  const $elenemt = elenemtRef.value
  const $dropdown = dropdownRef.value
  const isElenemtContains = $elenemt ? !$elenemt.contains(e.target) : true
  const isDropdownContains = $dropdown ? !$dropdown.contains(e.target) : true
  const isOutSide = isElenemtContains && isDropdownContains

  if (isOutSide) {
    onSwitchActive(false)
  }
}

const onResize = () => {
  device.value = onDevice()
  onDropdownOpen()
}

watch(
  () => model.value,
  () => {
    onSetSelectedIndex()
  }
)

watch(
  () => options.value,
  () => {
    onSetSelectedIndex()
  },
  {
    deep: true,
  }
)

onMounted(() => {
  onSetSelectedIndex()
  onResize()
  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <Field
      :name="props.name"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-slot="{ field, errorMessage }"
    >
      <input type="hidden" :id="props.name" v-bind="field" />
      <div class="m-form-container flex" :class="setClass.container">
        <button
          type="button"
          class="m-form-element --select grow text-left"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--error': errorMessage || config.isError },
          ]"
          :disabled="config.isDisabled"
          ref="elenemtRef"
          @click="onElementClick()"
          @keydown.up="onDropdownArrow($event)"
          @keydown.down="onDropdownArrow($event)"
          @keypress.enter="onDropdownEnter"
        >
          <div
            class="m-form-type w-full cursor-pointer truncate leading-[1.33]"
            :class="[
              setClass.type,
              {
                '--placeholder': !label || !model,
              },
            ]"
            ref="selectRef"
          >
            <template v-if="label">
              {{ options[selectedIndex][config.schema.label] }}
            </template>
            <template v-else-if="!label && placeholder.value">
              {{ placeholder.value }}
            </template>
          </div>
          <SvgIcon
            icon="caret_large_down"
            class="m-form-icon h-[14px] w-[14px] shrink-0 p-[2px] transition-transform duration-300"
            :class="setClass.icon"
            v-if="config.arrowType === 'caret'"
          />
          <i
            class="m-form-icon-arrow h-[16px] w-[16px] shrink-0"
            v-if="config.arrowType === 'arrow'"
          />
        </button>
        <small class="m-form-suffix" :class="setClass.suffix" v-if="$slots.suffix">
          <slot name="suffix" />
        </small>
      </div>
    </Field>
    <ErrorMessage
      as="span"
      :name="props.name"
      class="m-form-error"
      :class="setClass.error"
      v-slot="{ message }"
    >
      <ErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
  <Teleport to="body">
    <Transition name="select-dropdown" @afterLeave="onCloseDropdown" appear>
      <div
        class="m-select-dropdown absolute z-[5] mt-[3px] overflow-hidden"
        :class="setClass.dropdown"
        ref="dropdownRef"
        v-if="isActive && options && options.length !== 0 && !config.isDisabled"
      >
        <ul
          class="m-select-dropdown-container max-h-full bg-[--white]"
          :class="setClass.dropdownContainer"
          ref="dropdownContainerRef"
        >
          <li
            class="m-select-dropdown-item"
            v-for="(item, index) in options"
            :key="`${item}_${index}`"
            ref="dropdownItemRef"
          >
            <button
              type="button"
              class="m-select-dropdown-button block w-full px-[8px] text-left transition-colors duration-300"
              :class="{
                '--active': index === selectedIndex,
              }"
              :disabled="item[config.schema.isDisabled] === true"
              @click="onDropdownItemClick(index)"
            >
              <em class="m-select-dropdown-label relative block grow py-[8px] text-[14px]">
                <slot name="option" :item="item">
                  {{ item[config.schema.label] }}
                </slot>
              </em>
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </Teleport>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style src="@css/_modules/_vueTransition.css"></style>
<style lang="postcss">
.m-form-element {
  &.\-\-select {
    &.\-\-focus {
      .m-form-icon {
        @apply -rotate-180;
      }

      .m-form-icon-arrow {
        &:before {
          @apply -rotate-180;
        }
      }
    }

    &:not(:disabled) {
      .m-form-icon {
        @apply text-[--gray-999];
      }
    }

    &:disabled {
      .m-form-icon {
        @apply text-[--gray-ccce];
      }
    }
  }
}

.m-form-icon-arrow {
  &:before {
    @apply block h-0 w-0 border-x-[3px] border-t-[5px] border-transparent border-t-[--gray-222] transition-transform duration-300 content-default;
  }
}

.m-select-dropdown {
  box-shadow:
    0px 4px 24px 0px #02041614,
    0px 2px 16px -8px #02041633;
}

.m-select-dropdown-button {
  &:not(:disabled) {
    @apply text-[--gray-333];

    /* &:not(.\-\-active) {
    } */

    &.\-\-active {
      @apply bg-[--orange-feea];
    }
  }

  &:disabled {
    @apply text-[--gray-3334d];
  }
}

.m-select-dropdown-item {
  &:not(:last-child) {
    .m-select-dropdown-button {
      &:after {
        @apply block h-[1px] w-full bg-[--gray-e5] opacity-30 content-default;
      }
    }
  }
}
</style>
