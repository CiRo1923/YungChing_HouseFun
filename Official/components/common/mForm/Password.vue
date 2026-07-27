<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/passwordVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/password.css'
import { onDeepMerge } from '@js/_prototype.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'focusin', 'blur', 'input', 'keydown.enter'])

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  value: {
    type: [String, Number],
    default: null,
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

const model = ref(null)
const isFocus = ref(false)
const isVisible = ref(false) // 密碼是否顯示為明碼
const config = computed(() => {
  return onDeepMerge(
    {
      placeholder: '',
      length: null,
      minlength: null,
      maxlength: null,
      isReadonly: false,
      isDisabled: false,
      isError: false,
      hasClearButton: true, // 輸入後開啟 X 清除
    },
    props.config
  )
})
// 明碼時 type=text，遮罩時 type=password
const inputType = computed(() => (isVisible.value ? 'text' : 'password'))
const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      frontAssist: '',
      rearAssist: '',
      suffix: '',
      error: '',
    },
    ...props.setClass,
  }
})
const onBind = (field) => {
  const value =
    !props.modelValue && props.value
      ? {
          value: props.value,
        }
      : {}

  return {
    ...field,
    ...value,
  }
}

const onInput = (e) => {
  emits('input', e)
}

const onEnter = (e) => {
  e.preventDefault()
  emits('keydown.enter')
}

const onEvent = async (e, errorMessage) => {
  const { type } = e
  const isError = !!errorMessage
  const isFocusIn = type === 'focusin'
  const isBlur = type === 'blur'

  if (isFocusIn || isBlur) {
    isFocus.value = !isFocus.value
  }

  if (isBlur) {
    emits('update:modelValue', model.value)
    // blur 時等 update:modelValue 回填到上層 props 後再 emit,父層 onBlur 才讀得到最新值
    await nextTick()
  }

  emits(type, e, isError)
}

const onClear = () => {
  model.value = null
  emits('update:modelValue', '')
}

const onToggleVisible = () => {
  isVisible.value = !isVisible.value
}

watch(
  () => props.modelValue,
  (value) => {
    model.value = value
  },
  {
    immediate: true,
  }
)
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
    <Field
      v-slot="{ field, errorMessage }"
      v-model="model"
      :name="props.name"
      type="password"
      :rules="config.isDisabled ? '' : props.rules"
    >
      <div class="m-form-container overflow-hidden" :class="setClass.container">
        <div
          class="m-form-element --password"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--readonly': config.isReadonly },
            { '--disabled': config.isDisabled },
            { '--error': errorMessage || config.isError },
          ]"
        >
          <div
            v-if="$slots.frontAssist"
            class="m-form-assist shrink-0"
            :class="setClass.frontAssist"
          >
            <slot name="frontAssist" />
          </div>
          <input
            :id="props.name"
            :type="inputType"
            class="m-form-type min-w-0 grow leading-[1]"
            :class="setClass.type"
            v-bind="onBind(field)"
            :minlength="config.minlength || config.length"
            :maxlength="config.maxlength || config.length"
            :placeholder="config.placeholder"
            :readonly="config.isReadonly"
            :disabled="config.isDisabled"
            autocomplete="off"
            @focusin="onEvent($event)"
            @blur="onEvent($event, errorMessage)"
            @input="onInput($event)"
            @keydown.enter="onEnter($event)"
          />
          <button
            v-if="config.hasClearButton && !config.isDisabled"
            type="button"
            class="m-form-clear-button"
            :class="{
              '--show': model,
            }"
            tabindex="-1"
            @click="onClear"
          >
            <CommonSvgIcon icon="icon_xmark" class="m-form-clear-icon" />
          </button>
          <button
            type="button"
            class="m-form-password-button"
            tabindex="-1"
            @click="onToggleVisible"
          >
            <CommonSvgIcon
              :icon="isVisible ? 'icon_eye' : 'icon_eye_hidden'"
              class="m-form-password-eye-icon"
            />
          </button>

          <div v-if="$slots.rearAssist" class="m-form-assist shrink-0" :class="setClass.rearAssist">
            <slot name="rearAssist" />
          </div>
        </div>
        <small v-if="$slots.suffix" class="m-form-suffix shrink-0" :class="setClass.suffix">
          <slot
            name="suffix"
            :maxlength="config.length || config.maxlength"
            :length="model ? model.length : 0"
          />
        </small>
      </div>
    </Field>
    <ErrorMessage
      v-slot="{ message }"
      as="span"
      :name="props.name"
      class="m-form-error"
      :class="setClass.error"
    >
      <CommonMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
</template>
