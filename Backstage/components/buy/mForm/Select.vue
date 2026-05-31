<script setup>
import { onDeepClone, onEmptyData } from '@js/_prototype.js'
import { onMergeDropdownConfig, useDropdownCore } from './.composables/useDropdownCore.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const { onResize } = useCommonActions()

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
  modelModifiers: {
    type: Object,
    default: () => ({}),
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
const selectRef = ref(null)
const selectedIndex = ref(-1)
const label = ref(null)
const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    let result = value

    if (props.modelModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:modelValue', result)
  },
})
const config = computed(() => {
  const defaultConfig = {
    startOption: null,
    placeholder: null,
    isError: false,
    // dropdownWidth: 'auto',
    schema: {
      label: 'label',
      value: 'value',
    },
    keyboard: false,
    maxItems: 5,
  }

  return onMergeDropdownConfig(props.config, defaultConfig)
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
      dropdownButton: '',
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
  // When API fails or returns empty options, keep placeholder construction safe.
  const placeholderBase = options[0] ? onDeepClone(options[0]) : {}
  const placeholderItem = onEmptyData(placeholderBase) || {}

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
      // item.value == startOption 用 == 會有形態別問題 '1' (string) !== 1 (int)
      index = options.value.findIndex((item) => item.value == startOption)
    } else {
      // item[config.value.schema.value] == model.value 用 == 會有形態別問題 '1' (string) !== 1 (int)
      index = options.value.findIndex((item) => item[config.value.schema.value] == model.value)
    }

    // index = index === -1 ? 0 : index
    label.value = index !== -1 ? options.value[index][config.value.schema.label] : null
  }

  selectedIndex.value = index
}

const {
  elenemtRef,
  dropdownRef,
  dropdownContainerRef,
  dropdownItemRef,
  isFocus,
  isActive,
  isOpen,
  onSwitchActive,
  onCloseDropdown,
  onElementClick,
  onSelectResize,
  isDropdownOutside,
} = useDropdownCore({
  config,
  model,
  options,
  selectedIndex,
})

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
  if (isDropdownOutside(e)) {
    onSwitchActive(false)
  }
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

onResize()

onMounted(() => {
  onSetSelectedIndex()
  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onResize)
  window.addEventListener('resize', onSelectResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('resize', onSelectResize)
})
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
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
          class="m-form-element --select"
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
            class="m-form-type"
            :class="[
              setClass.type,
              {
                '--placeholder': !label || !model,
              },
            ]"
            ref="selectRef"
          >
            <template v-if="label">
              {{ label }}
            </template>
            <template v-else-if="!label && placeholder.value">
              {{ placeholder.value }}
            </template>
          </div>
          <CommonSvgIcon
            icon="caret_large_down"
            class="m-form-icon"
            :class="setClass.icon"
            v-if="config.arrowType === 'caret'"
          />
          <i class="m-form-icon-arrow" v-if="config.arrowType === 'arrow'" />
        </button>
        <small class="m-form-suffix" :class="setClass.suffix" v-if="$slots.suffix">
          <slot name="suffix" />
        </small>
      </div>
    </Field>
    <ErrorMessage
      as="span"
      :name="props.name"
      class="m-form-error block"
      :class="setClass.error"
      v-slot="{ message }"
    >
      <BuyMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
  <Teleport to="body">
    <Transition name="dropdown" @before-leave="onCloseDropdown" appear>
      <div
        class="m-form-dropdown --select"
        :class="[setClass.dropdown, { '--open': isOpen }]"
        ref="dropdownRef"
        v-if="isActive && options && options.length !== 0 && !config.isDisabled"
      >
        <div
          class="m-form-dropdown-container scrollbar --y"
          :class="setClass.dropdownContainer"
          ref="dropdownContainerRef"
        >
          <div class="m-form-dropdown-header" v-if="$slots.dropdownHeader">
            <slot name="dropdownHeader" />
          </div>
          <ul class="m-form-dropdown-options">
            <li
              class="m-form-dropdown-item"
              v-for="(item, index) in options"
              :key="`${item}_${index}`"
              ref="dropdownItemRef"
            >
              <button
                type="button"
                class="m-form-dropdown-button"
                :class="[
                  setClass.dropdownButton,
                  {
                    '--active': index === selectedIndex,
                  },
                ]"
                :disabled="item[config.schema.isDisabled] === true"
                @click="onDropdownItemClick(index)"
              >
                <CommonSvgIcon
                  icon="icon_check_solid"
                  class="m-form-dropdown-icon"
                  v-if="index === selectedIndex"
                />
                <em class="m-form-dropdown-label">
                  <slot name="option" :item="item">
                    {{ item[config.schema.label] }}
                  </slot>
                </em>
              </button>
            </li>
          </ul>
          <footer class="m-form-dropdown-footer" v-if="$slots.dropdownFooter">
            <slot name="dropdownFooter" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style src="@css/_modules/buy/mFormDropdown.css"></style>
<style lang="postcss"></style>
