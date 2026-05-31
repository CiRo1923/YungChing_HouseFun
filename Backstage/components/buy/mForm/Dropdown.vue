<script setup>
import { onMergeDropdownConfig, useDropdownCore } from './.composables/useDropdownCore.js'

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
    placeholder: null,
    isError: false,
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
      icon: '',
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
  onDropdownOpen,
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
        >
          <em
            class="m-form-type"
            :class="[
              setClass.type,
              {
                '--placeholder': !model,
              },
            ]"
            v-html="model || placeholder.value"
            ref="selectRef"
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
          <div class="m-form-dropdown-header" v-if="$slots.dropdownHeader">
            <slot name="dropdownHeader" />
          </div>
          <div class="m-form-dropdown-body">
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

<style src="@css/_modules/buy/mForm.css"></style>
<style src="@css/_modules/buy/mFormDropdown.css"></style>
<style lang="postcss"></style>
