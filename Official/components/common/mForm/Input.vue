<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/inputText.css'

import { useInputTextCore } from './.composables/useInputTextCore.js'
import useValidateEvents from './.composables/useValidateEvents.js'

import { numberComma, onToFixed } from '@js/_prototype.js'
import '@js/_validation.js'
// import { userStore } from '@store/user.js'

import { Field, ErrorMessage } from 'vee-validate'

// const user = userStore()
const emits = defineEmits([
  'update:modelValue',
  'focusin',
  // 'focusout',
  'blur',
  'input',
  'enter',
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
  modelModifiers: {
    type: Object,
    default: () => ({}),
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
// 供外層操作原生 input(例如 mFormContinuous 要在填完一格後 focus 下一格)
const inputRef = ref(null)

const defaultConfig = {
  placeholder: '',
  // 驗證時機。null = 沿用全域(等同 ['blur', 'change', 'modelUpdate']);
  // 傳陣列為「完整指定」,詳見 .composables/useValidateEvents.js
  validateEvents: null,
  length: null,
  minlength: null,
  maxlength: null,
  formatLength: null,
  isReadonly: false,
  isDisabled: false,
  isError: false,
  inputMode: null,
  hasClearButton: true, // 輸入後開啟 X 清除
  inputChinese: true, // 開啟關閉輸入中文
  comma: false, // 啟用千分位功能
  checkNotIsZero: false, // 輸入欄位致不能為 0
  integer: false, // 整數功能 (不可使用小數點)
  allowNegative: false, // 允許輸入負數（inputMode 為 tel 時不適用）
  toFixed: null, // 取得小數點第幾位
}
const defaultSetClass = {
  main: '',
  container: '',
  element: '',
  type: '',
  formatLength: '',
  frontAssist: '',
  rearAssist: '',
  suffix: '',
  error: '',
}
const { isFocus, config, setClass } = useInputTextCore(props, {
  defaultConfig,
  defaultSetClass,
})
const validateOn = useValidateEvents(() => config.value.validateEvents)
const isNumeric = computed(() => /^(decimal|numeric|tel)$/.test(config.value.inputMode))
const isTel = computed(() => config.value.inputMode === 'tel')
// 電話號碼不會是負的，tel 一律不吃 allowNegative
const canNegative = computed(() => config.value.allowNegative && !isTel.value)
// 負號會多佔一個字元，maxlength 要跟著多留一位，否則實際能填的位數會少一位
const fieldMaxlength = computed(() => {
  const { maxlength, length } = config.value
  const max = maxlength || length

  if (!max) return null

  return canNegative.value ? Number(max) + 1 : max
})
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
    number: canNegative.value
      ? integer
        ? /[^0-9-]/g
        : /[^0-9.-]/g
      : integer || isTel.value
        ? /[^0-9]/g
        : /[^0-9.]/g,
  }

  const isRemoveChinese =
    (/^(decimal|numeric)$/.test(inputMode) || !inputChinese) && regex.chinese.test(value)

  await nextTick()

  if (isNumeric.value) {
    let number = regex.number.test(value) ? value.replace(regex.number, '') : value
    // 負號只有放在最前面才有意義，先抽出來，中間打的 '-' 一律砍掉，處理完再接回去
    const sign = canNegative.value && number.startsWith('-') ? '-' : ''

    if (canNegative.value) number = number.replace(/-/g, '')

    const digits =
      (checkNotIsZero && integer && /^0/.test(number)) || (checkNotIsZero && /^0\d/.test(number))
        ? number.replace(/^0+/, '')
        : number

    model.value = `${sign}${digits}`
  } else if (isRemoveChinese) {
    model.value = value.replace(regex.chinese, '')
  }

  emits('input', e)
}

// 事件名用 enter 而非 keydown.enter:在元件上寫 @keydown.enter,Vue 會編成
// onKeydown + withKeys(.enter 是 key modifier),接不到名為 'keydown.enter' 的 emit,
// 只會靠原生事件冒泡到根元素才誤打誤撞觸發(且時序早於下面的回寫)。
const onEnter = async (e) => {
  e.preventDefault()

  // update:modelValue 只在 blur 時回寫(見 onEvent),而 enter 不會觸發 blur →
  // 先主動 blur 走完既有的正規化與回寫,父層在 enter 事件裡才讀得到最新值
  e.target.blur()
  await nextTick()

  emits('enter', e)
}

const onEvent = async (e, errorMessage) => {
  const { comma, integer, checkNotIsZero } = config.value
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
    const raw = model.value

    // 如果有 comma 顯示，先用「去逗號後」的值來判斷
    const plain = isComma ? numberComma.remove(raw, false) : raw

    if (isTel.value) {
      // tel：只留數字、不可有小數點，且保留前導 0（電話號碼）
      const normalized = String(plain ?? '').replace(/[^0-9]/g, '')

      emits('update:modelValue', normalized)
      model.value = isComma ? numberComma.add(normalized, false) : normalized
    } else if (isNumeric.value) {
      // 1) 先把暫態輸入修正：'.' -> ''、'0.' -> '0'（或 ''，看你規則）
      //    你需求是 checkNotIsZero 時不能是 0，所以 '0.' 這種 blur 最後也不能留下
      let normalized = String(plain ?? '').trim()

      // 空值直接送出
      if (normalized === '') {
        emits('update:modelValue', '')
        model.value = isComma ? numberComma.add('', false) : ''
        // 等 update:modelValue 回填到上層 props 後再 emit blur，父層 onBlur 才讀得到最新值
        await nextTick()
        emits(type, e, isError)
        return
      }

      // 只打一個 '.' 的狀況
      if (normalized === '.') normalized = ''

      // 負號先抽掉，後面的前導 0 修剪、checkNotIsZero 判斷都只針對數字本身
      // （'-0123' 的前導 0 修剪原本會因為開頭是 '-' 而失效）
      const sign = canNegative.value && normalized.startsWith('-') ? '-' : ''

      if (canNegative.value) normalized = normalized.replace(/-/g, '')

      // 2) 若 integer：禁止小數點（blur 時直接砍掉小數部分）
      //    例：'12.34' -> '12'
      if (integer && normalized.includes('.')) {
        normalized = normalized.split('.')[0]
      }

      // 3) 去掉多餘前導 0（單獨 0 要保留；小數模式保留 0.x 的 0）
      if (normalized) {
        if (integer) {
          normalized = normalized.replace(/^0+(?=\d)/, '')
        } else {
          // 非整數：保留 "0.xxx"
          if (!normalized.startsWith('0.')) {
            normalized = normalized.replace(/^0+(?=\d)/, '')
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

        // '0.' blur 時清掉
        if (/^0\.$/.test(normalized)) normalized = ''
      }

      // 負號接回去，讓 toFixed / Number 直接處理帶號的值
      if (sign && normalized !== '') normalized = `${sign}${normalized}`

      // 5) toFixed
      if (!integer && config.value.toFixed != null && config.value.toFixed !== '') {
        const d = Number(config.value.toFixed)
        if (Number.isFinite(d) && normalized !== '') {
          normalized = props.modelModifiers.number
            ? Number(onToFixed(Number(normalized), d))
            : String(Number(onToFixed(Number(normalized), d)))
        }
      }

      // 6) 最終送出（注意：送出要送「無逗號」值）
      emits('update:modelValue', normalized)

      // 顯示用的 model.value 再套 comma
      model.value = isComma ? numberComma.add(normalized, false) : normalized
    } else {
      // 非 numeric 就照舊：送出 plain（有 comma 的話也去逗號）
      emits('update:modelValue', plain)
      model.value = isComma ? numberComma.add(plain, false) : plain
    }
  }

  // blur 時等 update:modelValue 回填到上層 props 後再 emit，父層 onBlur 才讀得到最新值
  if (isBlur) {
    await nextTick()
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

defineExpose({
  inputRef,
  focus: () => inputRef.value?.focus(),
  select: () => inputRef.value?.select(),
  blur: () => inputRef.value?.blur(),
})
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <Field
      v-slot="{ field, errorMessage }"
      v-model="model"
      :name="props.name"
      :type="props.type"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
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
          <div v-if="$slots.frontAssist" class="m-form-assist" :class="setClass.frontAssist">
            <slot name="frontAssist" />
          </div>
          <input
            ref="inputRef"
            :id="props.name"
            :type="props.type"
            class="m-form-type"
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
          <span v-if="formatLength" class="m-form-length" :class="setClass.length">
            {{ formatLength }}
          </span>
          <div v-if="$slots.rearAssist" class="m-form-assist" :class="setClass.rearAssist">
            <slot name="rearAssist" />
          </div>
        </div>
        <small v-if="$slots.suffix" class="m-form-suffix" :class="setClass.suffix">
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
