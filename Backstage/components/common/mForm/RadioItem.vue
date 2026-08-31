<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/selectionVariables.css'
import '@css/_modules/common/mForm/radioItemVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/selection.css'
import '@css/_modules/common/mForm/radioItem.css'

import useValidateEvents from './.composables/useValidateEvents.js'

import { onDeepMerge } from '@js/_prototype.js'
import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [Boolean, String, Number],
    default: undefined,
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
  get() {
    return props.modelValue
  },

  set(val) {
    emits('update:modelValue', val)
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
      align: 'center',
      isError: false,
      isDisabled: false,
    },
    props.config
  )
})
const validateOn = useValidateEvents(() => config.value.validateEvents)

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
  emits('change')
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
      v-slot="{ errorMessage }"
    >
      <div class="m-form-container" :class="setClass.container">
        <label
          class="m-form-element --radio-item"
          :class="[
            setClass.element,
            {
              '--align-top': config.align === 'top' && (config.label || $slots.default),
              '--error': config.isError,
              '--disabled': config.isDisabled,
              '--checked': model === config.value,
            },
          ]"
        >
          <input
            :name="props.name"
            type="radio"
            v-model="model"
            :value="config.value"
            class="m-form-type --visually-hidden"
            :class="{
              '--error': errorMessage,
            }"
            :disabled="config.isDisabled"
            @change="onChange"
          />
          <CommonSvgIcon
            icon="icon_check_solid"
            class="m-form-icon"
            :class="setClass.icon"
          />
          <div class="m-form-radio-item-label" :class="setClass.label">
            <slot />
          </div>
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
      <BuyMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
</template>

