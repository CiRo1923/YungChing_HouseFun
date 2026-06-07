<script setup>
import { numberComma, onToFixed } from '@js/_prototype.js'
import { useTextCore } from './.composables/useTextCore.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'focusin', 'blur', 'input', 'keydown.enter'])

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
  modelModifiers: {
    type: Object,
    default: () => ({}),
  },
  rules: {
    type: Object,
    default: null,
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

const model = ref(null)
const isFocus = ref(false)

const { config, setClass, onEnter } = useTextCore({
  props,
  emits,
  model,
  config: {
    length: null,
    minlength: null,
    maxlength: null,
    formatLength: null,
    isReadonly: false,
    isDisabled: false,
    isError: false,
    inputMode: null,
    inputChinese: true,
    comma: false,
    checkNotIsZero: false,
    integer: false,
    toFixed: null,
  },
  setClass: {
    frontAssist: '',
    length: '',
    rearAssist: '',
    suffix: '',
    error: '',
  },
})

const isNumeric = computed(() => /^(decimal|numeric)$/.test(config.value.inputMode))

// decimal 欄位：maxlength 只算小數點前位數，toFixed 算小數點後位數，
// 但原生 <input> maxlength 會計算整串，所以這裡換算成「整數位 + 小數點 + 小數位」的總長度
const fieldMaxlength = computed(() => {
  const { maxlength, length, toFixed, integer } = config.value
  const base = maxlength || length

  if (!base || integer || !isNumeric.value) return base

  const decimals = toFixed != null && toFixed !== '' ? Number(toFixed) : 0

  return Number(base) + (decimals > 0 ? decimals + 1 : 0)
})

// 依 maxlength（小數點前）與 toFixed（小數點後）限制 decimal 字串長度
const onLimitDecimal = (number, maxlength, toFixed) => {
  const firstDot = number.indexOf('.')
  let intPart = firstDot === -1 ? number : number.slice(0, firstDot)

  if (maxlength) intPart = intPart.slice(0, Number(maxlength))

  if (firstDot === -1) return intPart

  let decPart = number.slice(firstDot + 1).replace(/\./g, '')
  const decimals = toFixed != null && toFixed !== '' ? Number(toFixed) : null

  if (decimals != null && Number.isFinite(decimals)) {
    if (decimals === 0) return intPart
    decPart = decPart.slice(0, decimals)
  }

  return `${intPart}.${decPart}`
}

const formatLength = computed(() => {
  const { formatLength, maxlength } = config.value

  return formatLength && maxlength
    ? formatLength.replace(/\{\s*(length|maxlength)\s*\}/g, (_, key) => {
        return key === 'length' ? (model.value ? String(model.value.length) : 0) : String(maxlength)
      })
    : null
})

const onBind = (field) => {
  const { inputMode } = config.value
  const inputmode = isNumeric.value
    ? {
        inputmode: inputMode,
      }
    : {}

  return {
    ...field,
    ...inputmode,
  }
}

const onInput = async (e) => {
  const value = e.target.value
  const { inputMode, checkNotIsZero, integer, inputChinese, maxlength, toFixed } = config.value
  const regex = {
    chinese: /[\u4e00-\u9fa5０-９Ａ-Ｚａ-ｚ～！＠＃＄％︿＆＊（）＿｜｛｝［］＜＞？／＊＼＋－]/g,
    number: integer ? /[^0-9]/g : /[^0-9.]/g,
  }

  const isRemoveChinese =
    (/^(decimal|numeric)$/.test(inputMode) || !inputChinese) && regex.chinese.test(value)

  await nextTick()

  if (isNumeric.value) {
    let number = regex.number.test(value) ? value.replace(regex.number, '') : value

    if (!integer) number = onLimitDecimal(number, maxlength, toFixed)

    model.value =
      (checkNotIsZero && integer && /^0/.test(number)) || (checkNotIsZero && /^0\d/.test(number))
        ? number.replace(/^0+/, '')
        : number
  } else if (isRemoveChinese) {
    model.value = value.replace(regex.chinese, '')
  }

  emits('input', e)
}

const onEvent = (e, errorMessage) => {
  const { comma, integer, checkNotIsZero } = config.value
  const { type } = e
  const isError = !!errorMessage
  const isFocusIn = type === 'focusin'
  const isBlur = type === 'blur'
  const isComma = comma && (model.value !== '' || model.value != null)

  if (isFocusIn) {
    isFocus.value = true
  }

  if (isBlur) {
    isFocus.value = false
  }

  if (isFocusIn && isComma) {
    model.value = numberComma.remove(model.value, false)
  }

  if (isBlur) {
    const raw = model.value
    const plain = isComma ? numberComma.remove(raw, false) : raw

    if (isNumeric.value) {
      let normalized = String(plain ?? '').trim()

      if (normalized === '') {
        emits('update:modelValue', '')
        model.value = isComma ? numberComma.add('', false) : ''
        emits(type, e, isError)
        return
      }

      if (normalized === '.') normalized = ''

      if (integer && normalized.includes('.')) {
        normalized = normalized.split('.')[0]
      }

      if (normalized) {
        if (integer) {
          normalized = normalized.replace(/^0+(?=\d)/, '')
        } else if (!normalized.startsWith('0.')) {
          normalized = normalized.replace(/^0+(?=\d)/, '')
          if (normalized.startsWith('.')) normalized = '0' + normalized
        }
      }

      if (checkNotIsZero) {
        const n = Number(normalized)
        const isTransient = normalized === '' || normalized === '0.' || normalized === '.'

        if (!isTransient && Number.isFinite(n) && n === 0) {
          normalized = ''
        }

        if (/^0\.$/.test(normalized)) normalized = ''
      }

      if (!integer && config.value.toFixed != null && config.value.toFixed !== '') {
        const d = Number(config.value.toFixed)

        if (Number.isFinite(d) && normalized !== '') {
          normalized = props.modelModifiers.number
            ? Number(onToFixed(Number(normalized), d))
            : String(Number(onToFixed(Number(normalized), d)))
        }
      }

      emits('update:modelValue', normalized)
      model.value = isComma ? numberComma.add(normalized, false) : normalized
    } else {
      emits('update:modelValue', plain)
      model.value = isComma ? numberComma.add(plain, false) : plain
    }
  }

  emits(type, e, isError)
}

const onWatchModel = (value) => {
  const { comma } = config.value
  const isComma = comma && value !== '' && value != null

  model.value = isComma ? numberComma.add(value, false) : value
}

const onClear = () => {
  model.value = null
  emits('update:modelValue', '')
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
      v-slot="{ field, errorMessage }"
      v-model="model"
      :name="props.name"
      :type="props.type"
      :rules="config.isDisabled ? '' : props.rules"
    >
      <div class="m-form-container" :class="setClass.container">
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
            v-if="$slots.frontAssist"
            class="m-form-assist shrink-0"
            :class="setClass.frontAssist"
          >
            <slot name="frontAssist" />
          </div>
          <input
            :id="props.name"
            :type="props.type"
            class="m-form-type min-w-0 grow leading-[1]"
            :class="setClass.type"
            v-bind="onBind(field)"
            :inputMode="config.inputMode"
            :minlength="config.minlength || config.length"
            :maxlength="fieldMaxlength"
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
          <span v-if="formatLength" class="m-form-length shrink-0" :class="setClass.length">
            {{ formatLength }}
          </span>
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
      class="m-form-error block"
      :class="setClass.error"
    >
      <BuyMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
