<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
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
      formatLength: null,
      isReadonly: false,
      isDisabled: false,
      isError: false,
      inputMode: null,
      isExistClose: true, // 輸入後開啟 X 清除
      inputChinese: true, // 開啟關閉輸入中文
      comma: false, // 啟用千分位功能
      checkNotIsZero: false, // 輸入欄位致不能為 0
      integer: false, // 整數功能 (不可使用小數點)
    },
    props.config
  )
})
const isNumeric = computed(() => config.value.inputMode === 'numeric')
const formatLength = computed(() => {
  const { formatLength, maxlength } = config.value

  return formatLength && maxlength
    ? formatLength.replace(/\{\s*(length|maxlength)\s*\}/g, (_, key) => {
        return key === 'length' ? (model.value ? String(model.value.length) : 0) : String(maxlength)
      })
    : null
})
const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      formatLength: '',
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
    let raw = model.value

    // 如果有 comma 顯示，先用「去逗號後」的值來判斷
    const plain = isComma ? numberComma.remove(raw, false) : raw

    if (isNumeric.value) {
      const { integer, checkNotIsZero } = config.value

      // 1) 先把暫態輸入修正：'.' -> ''、'0.' -> '0'（或 ''，看你規則）
      //    你需求是 checkNotIsZero 時不能是 0，所以 '0.' 這種 blur 最後也不能留下
      let normalized = String(plain ?? '').trim()

      // 空值直接送出
      if (normalized === '') {
        emits('update:modelValue', '')
        model.value = isComma ? numberComma.add('', false) : ''
        emits(type, e, isError)
        return
      }

      // 只打一個 '.' 的狀況
      if (normalized === '.') normalized = ''

      // 2) 若 integer：禁止小數點（blur 時直接砍掉小數部分）
      //    例：'12.34' -> '12'
      if (integer && normalized.includes('.')) {
        normalized = normalized.split('.')[0]
      }

      // 3) 去掉前導 0（但小數模式要保留 0.x 的 0）
      if (normalized) {
        if (integer) {
          normalized = normalized.replace(/^0+/, '')
        } else {
          // 非整數：保留 "0.xxx"
          if (!normalized.startsWith('0.')) {
            normalized = normalized.replace(/^0+/, '')
            if (normalized.startsWith('.')) normalized = '0' + normalized
          }
        }
      }

      // 4) checkNotIsZero：最終值不能是 0
      //    這裡用 Number 判斷，比正則安全（0.0、0.00 都會變 0）
      if (checkNotIsZero) {
        const n = Number(normalized)

        // normalized 可能變成 ''，或是 '0.'（如果你前面沒清掉），這裡一起處理
        const isTransient = normalized === '' || normalized === '0.' || normalized === '.'
        if (!isTransient && Number.isFinite(n) && n === 0) {
          normalized = '' // 你也可以改成 '1' 或回復成上一個值
        }

        // 你原本特例：'0.' blur 時清掉
        if (/^0\.$/.test(normalized)) normalized = ''
      }

      // 5) 最終送出（注意：送出要送「無逗號」值）
      emits('update:modelValue', normalized)

      // 顯示用的 model.value 再套 comma
      model.value = isComma ? numberComma.add(normalized, false) : normalized
    } else {
      // 非 numeric 就照舊：送出 plain（有 comma 的話也去逗號）
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
      :rules="config.isDisabled ? '' : props.rules"
      v-slot="{ field, errorMessage }"
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
            class="m-form-assist shrink-0"
            :class="setClass.frontAssist"
            v-if="$slots.frontAssist"
          >
            <slot name="frontAssist" />
          </div>
          <input
            :id="props.name"
            :type="props.type"
            class="m-form-type min-w-0 grow"
            :class="setClass.type"
            v-bind="onBind(field)"
            :inputMode="config.inputMode"
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
            type="button"
            class="m-form-clear-button"
            :class="{
              '--show': model,
            }"
            @click="onClear"
            v-if="config.isExistClose && !config.isDisabled"
          >
            <SvgIcon icon="icon_xmark" class="m-form-clear-icon" />
          </button>
          <span class="m-form-length shrink-0" :class="setClass.length" v-if="formatLength">
            {{ formatLength }}
          </span>
          <div class="m-form-assist shrink-0" :class="setClass.rearAssist" v-if="$slots.rearAssist">
            <slot name="rearAssist" />
          </div>
        </div>
        <small class="m-form-suffix shrink-0" :class="setClass.suffix" v-if="$slots.suffix">
          <slot
            name="suffix"
            :maxlength="config.length || config.maxlength"
            :length="model ? model.length : 0"
          />
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
