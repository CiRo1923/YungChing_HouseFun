<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/selectionVariables.css'
import '@css/_modules/common/mForm/radioVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/selection.css'
import '@css/_modules/common/mForm/radio.css'

import useValidateEvents from './.composables/useValidateEvents.js'

import { onDeepMerge } from '@js/_prototype.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number, Array, null],
    default: '',
  },
  rules: {
    type: Object,
    default: null,
  },
  config: {
    type: Object,
    default: () => {},
  },
  setClass: {
    type: Object,
    default: () => {},
  },
})

const model = computed({
  get: () => props.modelValue,
  set(value) {
    emits('update:modelValue', value)
  },
})

const config = computed(() => {
  return onDeepMerge(
    {
      // 驗證時機。勾選類控制項刻意不吃 blur —— 用鍵盤 Tab 經過卻還沒選就跳紅字,
      // 那是誤報。change 已涵蓋「使用者動了它」,submit 的主動 validate() 一律會驗、
      // 不受此設定影響。詳見 .composables/useValidateEvents.js
      validateEvents: ['change'],
      label: null,
      value: null,
      align: 'top',
      isDisabled: false,
    },
    props.config
  )
})
const validateOn = useValidateEvents(() => config.value.validateEvents)

const isChecked = computed(() => {
  const { value } = config.value
  return model.value === value
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      content: '',
      element: '',
      icon: '',
      label: '',
      error: '',
    },
    ...props.setClass,
  }
})

const onChange = () => {
  const { label, value } = config.value
  emits('change', {
    label,
    value,
  })
}
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <Field
      :name="props.name"
      type="radio"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
      v-slot="{ field, errorMessage }"
    >
      <div
        class="m-form-container"
        :class="[{ '--no-label': !config.label }, setClass.container]"
      >
        <label
          class="m-form-element --radio"
          :class="[
            { '--align-top': config.align === 'top' },
            { '--disabled': config.isDisabled },
            { '--has-label': config.label || $slots.default },
            { '--error': errorMessage },
            setClass.element,
          ]"
        >
          <input
            type="radio"
            v-bind="field"
            :value="config.value"
            :checked="isChecked"
            class="m-form-type jFormValid"
            :disabled="config.isDisabled"
            @change="onChange"
          />
          <i
            class="m-form-icon"
            :class="setClass.icon"
          />
          <slot>
            <em class="m-form-label" :class="setClass.label">{{ config.label }}</em>
          </slot>
        </label>
      </div>
    </Field>
    <ErrorMessage
      as="span"
      :name="props.name"
      class="m-form-error"
      :class="setClass.error"
      v-slot="{ message }"
    >
      <CommonMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
</template>
