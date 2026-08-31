<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/selectionVariables.css'
import '@css/_modules/common/mForm/checkboxVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/selection.css'
import '@css/_modules/common/mForm/checkbox.css'

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
    type: [Boolean, String, Array],
    default: undefined,
  },
  modelModifiers: {
    type: Object,
    default: () => ({}),
  },
  rules: {
    type: [String, Object, Function],
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
    const { mode } = config.value
    // value/boolean：完全不要轉 array
    if (mode !== 'group') return props.modelValue

    // group：input 端永遠 array
    const sep = joinSep.value

    if (Array.isArray(props.modelValue)) return props.modelValue

    // join 模式才從字串切回 array
    if (sep && typeof props.modelValue === 'string') {
      return props.modelValue
        ? props.modelValue
            .split(sep)
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    }

    // group 但外部給了字串（例如 '1'/'10'）→ 你要嘛當成單選 group，就包成 array
    if (typeof props.modelValue === 'string') return [props.modelValue]

    return []
  },

  set(val) {
    const { mode } = config.value
    // value/boolean：原樣吐回（或由 true/false-value 控制）
    if (mode !== 'group') {
      emits('update:modelValue', val)
      return
    }

    // group：可 join 才 join
    const sep = joinSep.value
    const sortedValue = onSortGroupValue(val)

    if (sep && Array.isArray(sortedValue)) {
      emits('update:modelValue', sortedValue.join(sep))
      return
    }

    emits('update:modelValue', sortedValue)
  },
})

const config = computed(() => {
  return onDeepMerge(
    {
      // 驗證時機。勾選類控制項刻意不吃 blur —— 用鍵盤 Tab 經過卻還沒選就跳紅字,
      // 那是誤報。change 已涵蓋「使用者動了它」,submit 的主動 validate() 一律會驗、
      // 不受此設定影響。詳見 .composables/useValidateEvents.js
      validateEvents: ['change'],
      mode: 'group', // 'boolean' | 'group' | 'value'
      sort: null, // null | 'desc' (大到小) | 'asc' (小到大)，只有 group 用
      label: null,
      value: null,
      align: 'top',
      isDisabled: false,
      isError: false,
      isJoin: null, // 只有 group 用
      valueClickClear: null,
    },
    props.config
  )
})
const validateOn = useValidateEvents(() => config.value.validateEvents)

const joinSep = computed(() => {
  const { mode, isJoin } = config.value
  if (mode !== 'group') return null

  if (isJoin === true) return ','
  if (typeof isJoin === 'string' && isJoin.length) return isJoin
  return null
})

// 「點了就清掉其他選項」的那一項（例如「不限」）。
// 給字串＝只比對值；給物件則可再帶 regex，用來清掉符合樣式的同群組選項。
const valueClear = computed(() => {
  const { mode, valueClickClear } = config.value
  const hasValueClickClear = valueClickClear !== null
  const isString = hasValueClickClear ? typeof valueClickClear === 'string' : false
  const isClearItem = mode === 'group' && !!(valueClickClear || valueClickClear === '')

  return hasValueClickClear && isClearItem
    ? {
        value: isString ? valueClickClear : valueClickClear.value,
        regex: isString ? null : valueClickClear.regex,
      }
    : null
})

// group 的值排序。數字能轉就用數字比，否則退回字串（localeCompare 帶 numeric）
const onSortGroupValue = (list) => {
  const { mode, sort } = config.value

  if (mode !== 'group') return list
  if (!Array.isArray(list)) return []
  if (!sort) return list

  const nextList = [...list]

  nextList.sort((a, b) => {
    const aNum = Number(a)
    const bNum = Number(b)
    const isANumber = !Number.isNaN(aNum) && a !== '' && a !== null
    const isBNumber = !Number.isNaN(bNum) && b !== '' && b !== null

    if (isANumber && isBNumber) {
      return sort === 'asc' ? aNum - bNum : bNum - aNum
    }

    const aStr = String(a)
    const bStr = String(b)

    return sort === 'asc'
      ? aStr.localeCompare(bStr, undefined, { numeric: true })
      : bStr.localeCompare(aStr, undefined, { numeric: true })
  })

  return nextList
}

// join 模式下，外部塞進來的 array 也要照 sort 排好再併回字串，
// 否則畫面已排序、送出的字串卻還是原順序
watch(
  () => [config.value.mode, joinSep.value, props.modelValue],
  ([mode, sep, modelValue]) => {
    if (mode !== 'group' || !sep || !Array.isArray(modelValue)) return

    const joinedValue = onSortGroupValue(modelValue).join(sep)

    if (joinedValue !== props.modelValue) {
      emits('update:modelValue', joinedValue)
    }
  },
  { immediate: true }
)

const bind = computed(() => {
  const { mode, value } = config.value

  // value / boolean：用 true-value/false-value 才不會變 boolean
  if (mode === 'value') {
    return {
      'true-value': value?.true, // 勾選回傳 '1' / '10'
      'false-value': value?.false, // 取消回傳 ''（你要 null 也可以）
    }
  }

  if (mode === 'boolean') {
    return {
      'true-value': true,
      'false-value': false,
    }
  }

  // group：用 value 做 array 比對
  return { value }
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

const onChange = async () => {
  const { mode, label, value } = config.value

  if (valueClear.value) {
    // 等 vee-validate 的 update:modelValue 經由 props 回流後再讀 model，
    // 否則會讀到點擊前的舊值（要點兩次才生效）。
    // 沒用 valueClickClear 就不延遲，維持既有呼叫端的 emit 時機。
    await nextTick()

    const isMatched = valueClear.value.value === value

    if (valueClear.value.regex && isMatched) {
      const regex = new RegExp(valueClear.value.regex)

      model.value = model.value.filter((item) => {
        if (item === valueClear.value.value) return true

        return !regex.test(String(item))
      })
    } else if (isMatched) {
      // 點到「清除項」本身：只留它
      model.value = valueClear.value.value ? [valueClear.value.value] : []
    } else {
      // 點到其他項：把「清除項」移除
      const valueClearIndex = model.value.findIndex((item) => item === valueClear.value.value)

      if (valueClearIndex !== -1) {
        const nextValue = [...model.value]

        nextValue.splice(valueClearIndex, 1)
        model.value = nextValue
      }
    }
  }

  emits('change', { mode, label, value })
}
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <Field
      :name="props.name"
      type="checkbox"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
      v-slot="{ errorMessage }"
    >
      <div class="m-form-container --checkbox" :class="setClass.container">
        <label
          class="m-form-element --checkbox"
          :class="[
            {
              '--align-top': config.align === 'top' && config.label,
              '--has-label': config.label,
              '--disabled': config.isDisabled,
            },
            setClass.element,
          ]"
        >
          <input
            :name="props.name"
            type="checkbox"
            v-model="model"
            v-bind="bind"
            class="m-form-type --visually-hidden"
            :class="{
              '--error': errorMessage || config.isError,
            }"
            :disabled="config.isDisabled"
            @change="onChange"
          />
          <CommonSvgIcon icon="icon_check_solid" class="m-form-icon" :class="setClass.icon" />
          <slot>
            <em :class="setClass.label" v-if="config.label">
              {{ config.label }}
            </em>
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
      <BuyMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
</template>
