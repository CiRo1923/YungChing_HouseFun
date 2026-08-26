<script setup>
import { onDeepMerge } from '@js/_prototype.js'
import { Field, ErrorMessage } from 'vee-validate'
import useValidateEvents from './.composables/useValidateEvents.js'

import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/selectionVariables.css'
import '@css/_modules/common/mForm/checkboxVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/selection.css'
import '@css/_modules/common/mForm/checkbox.css'

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
      // 驗證時機。勾選類控制項刻意不吃 blur —— 用鍵盤 Tab 經過卻還沒選就跳紅字,
      // 那是誤報。change 已涵蓋「使用者動了它」,submit 的主動 validate() 一律會驗、
      // 不受此設定影響。詳見 .composables/useValidateEvents.js
      validateEvents: ['change'],
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
const validateOn = useValidateEvents(() => config.value.validateEvents)

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

  emits('change', {
    mode,
    label,
    value,
  })
}
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
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
      <div
        class="m-form-container"
        :class="[{ 'leading-none': !config.label }, setClass.container]"
      >
        <label
          class="m-form-element --checkbox relative inline-flex gap-x-[6px] leading-[1.4]"
          :class="[
            config.align === 'top' ? 'items-baseline' : 'items-center',
            config.isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
            { '--error': errorMessage || config.isError },
            setClass.element,
          ]"
        >
          <input
            type="checkbox"
            v-bind="field"
            :value="config.value"
            class="m-form-type jFormValid sr-only"
            :disabled="config.isDisabled"
            @change="onChange"
            v-if="config.mode === 'group'"
          />

          <input
            type="checkbox"
            v-bind="field"
            :value="true"
            :unchecked-value="false"
            class="m-form-type jFormValid sr-only"
            :disabled="config.isDisabled"
            @change="onChange"
            v-else
          />

          <CommonSvgIcon
            icon="icon_check_solid"
            class="m-form-icon relative shrink-0 self-start border-solid transition-colors duration-300"
            :class="[
              {
                'mt-[2px]': config.label || $slots.default,
              },
              setClass.icon,
            ]"
          />

          <slot>
            <em
              class="m-form-label transition-colors duration-300"
              :class="setClass.label"
              v-if="config.label"
            >
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
      <CommonMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
</template>
