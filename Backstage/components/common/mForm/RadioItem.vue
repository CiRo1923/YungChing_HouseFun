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
      /* 驗證時機。勾選類控制項兩件事都刻意不做 —— 不吃 blur(Tab 經過還沒選就跳紅字
        是誤報;但 handleBlur 仍會標記 touched)、也不吃 change(change 就是
        「使用者剛選了它」,那時跳紅字等於一選就罵人)。
        只留 touchedModelUpdate,詳見 .composables/useValidateEvents.js */
      validateEvents: ['touchedModelUpdate'],
      label: null,
      value: null,
      align: 'center',
      isError: false,
      isDisabled: false,
    },
    props.config
  )
})
const validateOn = useValidateEvents(
  () => config.value.validateEvents,
  () => props.name
)

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
          <CommonSvgIcon icon="icon_check_solid" class="m-form-icon" :class="setClass.icon" />
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
