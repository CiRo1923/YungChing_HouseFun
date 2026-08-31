<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/dropdownVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/dropdown.css'

import { onMergeDropdownConfig, useDropdownCore } from './.composables/useDropdownCore.js'
import useValidateEvents from './.composables/useValidateEvents.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue'])
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
  config: {
    type: Object,
    default: () => ({}),
  },
  rules: {
    type: Object,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const selectedIndex = ref(-1)
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
    // 驗證時機。null = 沿用全域(等同 ['blur', 'change', 'modelUpdate']);
    // 傳陣列為「完整指定」,詳見 .composables/useValidateEvents.js
    validateEvents: null,
    placeholder: null,
    isError: false,
  }

  return onMergeDropdownConfig(props.config, defaultConfig)
})
const validateOn = useValidateEvents(() => config.value.validateEvents)

const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      icon: '',
      suffix: '',
      error: '',
      dropdown: '',
      dropdownContainer: '',
      dropdownBody: '',
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

const displayLabel = computed(() => {
  return model.value || placeholder.value?.value || null
})

const isPlaceholder = computed(() => {
  return !model.value
})

const {
  elenemtRef,
  dropdownRef,
  dropdownContainerRef,
  dropdownBodyRef,
  dropdownItemRef,
  isActive,
  isFocus,
  isOpen,
  onSwitchActive,
  onCloseDropdown,
  onDropdownOpen,
  onDropdownHeightUpdate,
  onElementClick,
  onSelectResize,
  isDropdownOutside,
} = useDropdownCore({
  config,
  selectedIndex,
})

const onOutSide = (e) => {
  if (isDropdownOutside(e)) {
    onSwitchActive(false)
  }
}

defineExpose({
  elenemtRef,
  dropdownRef,
  dropdownContainerRef,
  dropdownBodyRef,
  dropdownItemRef,
  isActive,
  isFocus,
  isOpen,
  onSwitchActive,
  onDropdownOpen,
  onDropdownHeightUpdate,
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
  <div class="m-form" :class="setClass.main">
    <Field
      :name="props.name"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
      v-slot="{ field, errorMessage }"
    >
      <input type="hidden" :id="props.name" v-bind="field" />
      <div class="m-form-container" :class="setClass.container">
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
        >
          <em
            class="m-form-type"
            :class="[
              setClass.type,
              {
                '--placeholder': isPlaceholder,
              },
            ]"
            v-html="displayLabel"
          />
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
      class="m-form-error"
      :class="setClass.error"
      v-slot="{ message }"
    >
      <BuyMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
  <Teleport to="body">
    <Transition name="dropdown" @beforeLeave="onCloseDropdown" appear>
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
          <div class="m-form-dropdown-header" v-if="$slots.dropdownHeader">
            <slot name="dropdownHeader" />
          </div>
          <div
            class="m-form-dropdown-body scrollbar --y"
            :class="setClass.dropdownBody"
            ref="dropdownBodyRef"
          >
            <slot name="dropdown" />
          </div>
          <footer class="m-form-dropdown-footer" v-if="$slots.dropdownFooter">
            <slot name="dropdownFooter" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
