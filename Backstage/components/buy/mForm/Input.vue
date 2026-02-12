<script setup>
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

import { deepMerge, numberComma } from '@js/_prototype.js'

import '@js/_validation.js'
// import { userStore } from '@store/user.js'

import { computed, nextTick, ref, watch } from 'vue'
import { Field, ErrorMessage } from 'vee-validate'

// const user = userStore()
const emits = defineEmits([
  'update:modelValue',
  'focusin',
  // 'focusout',
  'blur',
  'input',
  'keydown.enter',
])

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: 'text',
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
    type: [String, Object],
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
// const isOnComposition = ref(false)
const model = ref(null)
const isFocus = ref(false)
const config = computed(() => {
  return deepMerge(
    {
      placeholder: '',
      length: null,
      minlength: null,
      maxlength: null,
      isReadonly: false,
      isDisabled: false,
      isError: false,
      inputMode: null,
      inputChinese: true, // 開啟關閉輸入中文
      comma: false, // 啟用千分位功能
      checkNotIsZero: false, // 輸入欄位致不能為 0
      integer: false, // 整數功能 (不可使用小數點)
    },
    props.config
  )
})
const isNumeric = computed(() => config.value.inputMode === 'numeric')
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
  const { inputMode } = config.value
  const value =
    !props.modelValue && props.value
      ? {
          value: props.value,
        }
      : {}
  const inputmode = isNumeric.value
    ? {
        inputmode: inputMode,
      }
    : {}

  return {
    ...field,
    ...value,
    ...inputmode,
  }
}

const onInput = async (e) => {
  const value = e.target.value
  const { inputMode, checkNotIsZero, integer, inputChinese } = config.value
  const regex = {
    chinese: /[\u4e00-\u9fa5０-９Ａ-Ｚａ-ｚ～！＠＃＄％︿＆＊（）＿｜｛｝［］＜＞？／＊＼＋－]/g,
    number: integer ? /[^0-9]/g : /[^0-9.]/g,
  }

  const isRemoveChinese = (/numeric/.test(inputMode) || !inputChinese) && regex.chinese.test(value)

  await nextTick()

  if (isNumeric.value) {
    const number = regex.number.test(value) ? value.replace(regex.number, '') : value

    model.value =
      (checkNotIsZero && integer && /^0/.test(number)) || (checkNotIsZero && /^0\d/.test(number))
        ? number.replace(/^0+/, '')
        : number
  } else if (isRemoveChinese) {
    model.value = value.replace(regex.chinese, '')
  }

  emits('input', e)
}

const onEnter = (e) => {
  e.preventDefault()
  emits('keydown.enter')
}

const onEvent = (e, errorMessage) => {
  const { comma, checkNotIsZero } = config.value
  const { type } = e
  const isError = !!errorMessage
  const isFocusIn = type === 'focusin'
  const isBlur = type === 'blur'
  const isComma = comma && (model.value !== '' || model.value != null)

  if (isFocusIn || isBlur) {
    isFocus.value = !isFocus.value
  }

  if (isFocusIn && isComma) {
    model.value = numberComma.remove(model.value, false)
  }

  if (isBlur) {
    if (isNumeric.value) {
      model.value =
        checkNotIsZero && /^0\.$/.test(model.value) ? model.value.replace(/^0\.$/, '') : model.value
    }

    const value = isComma ? numberComma.remove(model.value, false) : model.value

    emits('update:modelValue', value)

    model.value = isComma ? numberComma.add(model.value, false) : model.value
  }

  emits(type, e, isError)
}

const onWatchModel = (value) => {
  const { comma } = config.value
  const isComma = comma && value !== '' && value != null

  model.value = isComma ? numberComma.add(value, false) : value
}

watch(
  () => props.modelValue,
  (value) => {
    onWatchModel(value)
  },
  {
    immediate: true,
  }
)
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
    <Field
      :name="props.name"
      :type="props.type"
      v-model="model"
      :rules="props.rules"
      v-slot="{ field, errorMessage }"
    >
      <div class="m-form-container flex">
        <div
          class="m-form-element"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--readonly': config.isReadonly },
            { '--disabled': config.isDisabled },
            { '--error': errorMessage || config.isError },
          ]"
        >
          <div
            class="m-form-assist flex-shrink-0"
            :class="setClass.frontAssist"
            v-if="$slots.frontAssist"
          >
            <slot name="frontAssist" />
          </div>
          <input
            :id="props.name"
            :type="props.type"
            class="m-form-type min-w-0 flex-grow"
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
          <div
            class="m-form-assist flex-shrink-0"
            :class="setClass.rearAssist"
            v-if="$slots.rearAssist"
          >
            <slot name="rearAssist" />
          </div>
        </div>
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
</template>
<style src="@css/_modules/buy/mForm.css"></style>
