<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   scripts/_prototype.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。
   scripts/_validation.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。 */

import './.css/variables.css'
import './.css/passwordVariables.css'
import './.css/common.css'
import './.css/password.css'
import './.css/styleProject.css'

import useValidateEvents from './.composables/useValidateEvents.js'

import { onDeepMerge } from '@js/_prototype.js'
import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'focusin', 'blur', 'input', 'enter'])

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
      /* 要掛在元素上的屬性,依位置各一組 —— 位置名與 setClass 同一套
        (能傳 class 的地方就能傳屬性),例如 { type: { 'data-x': 'y' } }。

        有些東西只能靠元素上的屬性做到:難字的造字對照、無障礙的標記、
        第三方套件用屬性認元素 —— 那幾種沒辦法用 class 或 slot 代替。

        預設是空的,傳進來才掛。 */
      attr: {},
      placeholder: '',
      // 驗證時機。blur / change 一律驗;值一動就驗只在「碰過之後」才生效
      // (touchedModelUpdate 的用意見 .composables/useValidateEvents.js)。
      // 傳陣列為「完整指定」,沒列到的一律關閉。
      validateEvents: ['blur', 'change', 'touchedModelUpdate'],
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
const validateOn = useValidateEvents(
  () => config.value.validateEvents,
  () => props.name
)
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
/* 這個欄位與表單的連動(名稱、事件、值)—— 畫面那一行把它接在
   使用端掛的屬性**後面**:順序反過來的話,使用端傳了同名的屬性就會蓋掉它,
   而那個欄位從此不再跟著表單走,不會報錯,只是驗證與送出都收不到它。 */
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

// 與 Input.vue 同一套:事件名用 enter,並先 blur 讓 update:modelValue 回寫,
// 父層在 enter 事件裡才讀得到最新值
const onEnter = async (e) => {
  e.preventDefault()
  e.target.blur()

  await nextTick()

  emits('enter', e)
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
  <div class="m-form" :class="setClass.main" v-bind="config.attr.main">
    <Field
      v-slot="{ field, errorMessage }"
      v-model="model"
      :name="props.name"
      type="password"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
    >
      <div class="m-form-container --password" :class="setClass.container" v-bind="config.attr.container">
        <div
          class="m-form-element --password"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--readonly': config.isReadonly },
            { '--disabled': config.isDisabled },
            { '--error': errorMessage || config.isError },
          ]"
          v-bind="config.attr.element"
        >
          <div
            v-if="$slots.frontAssist"
            class="m-form-assist"
            :class="setClass.frontAssist"
            v-bind="config.attr.frontAssist"
          >
            <slot name="frontAssist" />
          </div>
          <input
            :id="props.name"
            :type="inputType"
            class="m-form-type"
            :class="setClass.type"
            v-bind="{ ...config.attr.type, ...onBind(field) }"
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
            <CommonMSvgIcon icon="icon_xmark" class="m-form-clear-icon" />
          </button>
          <button
            type="button"
            class="m-form-password-button"
            tabindex="-1"
            @click="onToggleVisible"
          >
            <CommonMSvgIcon
              :icon="isVisible ? 'icon_eye' : 'icon_eye_hidden'"
              class="m-form-password-eye-icon"
            />
          </button>

          <div
            v-if="$slots.rearAssist"
            class="m-form-assist"
            :class="setClass.rearAssist"
            v-bind="config.attr.rearAssist"
          >
            <slot name="rearAssist" />
          </div>
        </div>
        <small
          v-if="$slots.suffix"
          class="m-form-suffix"
          :class="setClass.suffix"
          v-bind="config.attr.suffix"
        >
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
      v-bind="config.attr.error"
    >
      <CommonMErrorMessage :message="message" />
    </ErrorMessage>
  </div>
</template>
