<script setup>
import './.css/variables.css'
import './.css/selectionVariables.css'
import './.css/checkboxVariables.css'
import './.css/common.css'
import './.css/selection.css'
import './.css/checkbox.css'
import './.css/styleProject.css'

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
    type: [Array, Boolean, String],
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
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
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
      mode: 'group', // 'group' | 'boolean'
      sort: null, // null | 'desc' (大到小) | 'asc' (小到大)
      label: null,
      value: null, // group 用
      align: 'top',
      isDisabled: false,
      isError: false,
      isJoin: null, // 只有 group 用
      valueClickClear: null,
    },
    props.config
  )
})
const validateOn = useValidateEvents(
  () => config.value.validateEvents,
  () => props.name
)

const model = computed({
  get() {
    if (config.value.mode === 'group') {
      const sep = joinSep.value
      const currentValue = config.value.value

      if (Array.isArray(props.modelValue)) {
        if (props.modelValue.length === 0 && currentValue === '') {
          return ['']
        }

        return props.modelValue
      }

      if (typeof props.modelValue === 'string') {
        if (!props.modelValue) {
          return currentValue === '' ? [''] : []
        }

        return sep
          ? props.modelValue
              .split(sep)
              .map((s) => s.trim())
              .filter(Boolean)
          : [props.modelValue]
      }

      return currentValue === '' ? [''] : []
    }

    return typeof props.modelValue === 'boolean' ? props.modelValue : false
  },
  set(value) {
    if (config.value.mode === 'group') {
      const sep = joinSep.value

      if (!Array.isArray(value)) {
        emits('update:modelValue', sep ? '' : [])
        return
      }

      const sortedValue = onSortGroupValue(value)

      if (sep) {
        emits('update:modelValue', sortedValue.join(sep))
        return
      }

      emits('update:modelValue', sortedValue)
      return
    }

    emits('update:modelValue', Boolean(value))
  },
})

/* 這一格現在是不是選中的。

  兩種模式的答案不在同一個地方:整組共用一個名字時,選中的是一份清單,
  要問「這一格的值在不在裡面」;只有一格時,值本身就是答案。
  只認其中一種的話,另一種模式永遠算成沒選中,而畫面上看得到它是勾著的。 */
const isChecked = computed(() => {
  if (config.value.mode !== 'group') return model.value === true

  return Array.isArray(model.value) && model.value.includes(config.value.value)
})

const joinSep = computed(() => {
  if (config.value.mode !== 'group') return null

  const { isJoin } = config.value

  if (isJoin === true) return ','
  if (typeof isJoin === 'string' && isJoin.length) return isJoin

  return null
})

watch(
  () => [config.value.mode, joinSep.value, props.modelValue],
  ([mode, sep, modelValue]) => {
    if (mode !== 'group' || !sep || !Array.isArray(modelValue)) return

    const sortedValue = onSortGroupValue(modelValue)
    const joinedValue = sortedValue.join(sep)

    if (joinedValue !== props.modelValue) {
      emits('update:modelValue', joinedValue)
    }
  },
  {
    immediate: true,
  }
)

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

const setClass = computed(() => {
  return {
    main: '',
    content: '',
    element: '',
    icon: '',
    label: '',
    error: '',
    ...props.setClass,
  }
})

const onSortGroupValue = (list) => {
  if (config.value.mode !== 'group') return list
  if (!Array.isArray(list)) return []

  const { sort } = config.value
  if (!sort) return list

  const nextList = [...list]

  nextList.sort((a, b) => {
    const aNum = Number(a)
    const bNum = Number(b)

    const isANumber = !Number.isNaN(aNum) && a !== '' && a !== null
    const isBNumber = !Number.isNaN(bNum) && b !== '' && b !== null

    // 兩個都可轉數字 -> 用數字排
    if (isANumber && isBNumber) {
      return sort === 'asc' ? aNum - bNum : bNum - aNum
    }

    // 否則用字串排
    const aStr = String(a)
    const bStr = String(b)

    return sort === 'asc'
      ? aStr.localeCompare(bStr, undefined, { numeric: true })
      : bStr.localeCompare(aStr, undefined, { numeric: true })
  })

  return nextList
}

const onChange = async () => {
  const { label, value, mode } = config.value

  // 等 vee-validate 的 update:modelValue 經由 props 回流後，
  // 再讀 model.value 套用清空邏輯，否則會讀到點擊前的舊值（要點兩次才生效）
  await nextTick()

  if (valueClear.value) {
    const isMatched = valueClear.value.value === value
    const isRegExp = valueClear.value.regex && isMatched

    if (isRegExp) {
      const regex = new RegExp(valueClear.value.regex)

      model.value = model.value.filter((item) => {
        if (item === valueClear.value.value) return true
        return !regex.test(String(item))
      })
    } else {
      if (isMatched) {
        model.value = valueClear.value.value ? [valueClear.value.value] : []
      } else {
        const valueClearIndex = model.value.findIndex((item) => item === valueClear.value.value)

        if (valueClearIndex !== -1) {
          const nextValue = [...model.value]
          nextValue.splice(valueClearIndex, 1)
          model.value = nextValue
        }
      }
    }
  }

  /* 這次動作之後的狀態,以及把它改回去的手段。

    使用端有時要在「算數」之前先問一句:勾選後比對各列資料,不一致時跳確認彈窗,
    確認了才真的套用。少了這兩樣的話,使用端讀不出這次是勾還是取消
    (通知裡只有那一格的值,不是整組的狀態),也沒有辦法把它退回去。

    **這是還原,不是攔截。** 通知在畫面更新之後才發 ——
    要等值回流才讀得到清空邏輯的結果,所以 onChecked(false) 是
    「勾起來之後退回去」。要在畫面更新前就攔住的話,得在原生的點擊事件上
    preventDefault 並自己接管整個狀態,那是另一種形狀,不是這支現在的做法。 */
  const checked =
    mode === 'group' ? Array.isArray(model.value) && model.value.includes(value) : !!model.value

  const onChecked = (next) => {
    if (mode !== 'group') {
      model.value = Boolean(next)
      return
    }

    const list = Array.isArray(model.value) ? [...model.value] : []
    const at = list.indexOf(value)

    /* 已經是那個狀態就不動它 —— 重複加會讓同一個值出現兩次,
       而那一組的值之後會被接成字串送出去。 */
    if (next && at < 0) list.push(value)
    if (!next && at >= 0) list.splice(at, 1)

    model.value = list
  }

  emits('change', {
    mode,
    label,
    value,
    checked,
    onChecked,
  })
}
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <Field
      :name="props.name"
      type="checkbox"
      :value="config.mode === 'group' ? config.value : true"
      :uncheckedValue="config.mode === 'boolean' ? false : undefined"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
      v-slot="{ field, errorMessage }"
    >
      <div class="m-form-container" :class="[{ '--no-label': !config.label }, setClass.container]">
        <label
          class="m-form-element --checkbox"
          :class="[
            { '--align-top': config.align === 'top' },
            /* 選中狀態掛在這一層,使用端的樣式才接得到 ——
              勾選狀態在 <input> 上,而它是這個 <label> 的子元素:
              css 沒有辦法讓父層對子層的狀態有反應(`:has()` 以外沒有第二種寫法,
              而那個在比較舊的內嵌瀏覽器上不成立)。使用端也算不出來,
              那要比對 modelValue,是元件內部才有的資訊。 */
            { '--checked': isChecked },
            { '--disabled': config.isDisabled },
            { '--has-label': config.label || $slots.default },
            { '--error': errorMessage || config.isError },
            setClass.element,
          ]"
        >
          <input
            type="checkbox"
            v-bind="field"
            :value="config.value"
            class="m-form-type jFormValid"
            :disabled="config.isDisabled"
            @change="onChange"
            v-if="config.mode === 'group'"
          />

          <input
            type="checkbox"
            v-bind="field"
            :value="true"
            :unchecked-value="false"
            class="m-form-type jFormValid"
            :disabled="config.isDisabled"
            @change="onChange"
            v-else
          />

          <CommonMSvgIcon icon="icon_check_solid" class="m-form-icon" :class="setClass.icon" />

          <slot>
            <em class="m-form-label" :class="setClass.label" v-if="config.label">
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
      <CommonMErrorMessage :message="message" />
    </ErrorMessage>
  </div>
</template>
