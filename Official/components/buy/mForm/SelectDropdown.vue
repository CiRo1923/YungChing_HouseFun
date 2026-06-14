<script setup>
import { onMergeDropdownConfig, useDropdownCore } from './.composables/useDropdownCore.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number, Boolean, Object],
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
const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    emits('update:modelValue', value)
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

const {
  elenemtRef,
  dropdownRef,
  dropdownContainerRef,
  isFocus,
  isActive,
  onSwitchActive,
  onCloseDropdown,
  onElementClick,
  onSelectResize,
  onDropdownHeightUpdate,
  isDropdownOutside,
} = useDropdownCore({
  config,
})

const onDropdownEnter = () => {
  const $selectRef = selectRef.value

  onSwitchActive(false)
  $selectRef?.blur()
}

const onOutSide = (e) => {
  if (isDropdownOutside(e)) {
    onSwitchActive(false)
  }
}

onMounted(() => {
  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onSelectResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onSelectResize)
})

defineExpose({
  onClose: onCloseDropdown,
  onDropdownHeight: onDropdownHeightUpdate,
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
          class="m-form-element --select"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--error': errorMessage || config.isError },
          ]"
          :disabled="config.isDisabled"
          ref="elenemtRef"
          @click="onElementClick()"
          @keypress.enter="onDropdownEnter"
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
          <!-- <i
            class="m-form-icon-arrow h-[16px] w-[16px] shrink-0"
            v-if="config.arrowType === 'arrow'"
          /> -->
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
    <Transition name="dropdown" @afterLeave="onCloseDropdown" appear>
      <div
        class="m-select-dropdown"
        :class="setClass.dropdown"
        ref="dropdownRef"
        v-if="isActive && !config.isDisabled"
      >
        <div
          class="m-select-dropdown-container"
          :class="setClass.dropdownContainer"
          ref="dropdownContainerRef"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style src="@css/_modules/buy/mFormSelect.css"></style>
<style lang="postcss"></style>
