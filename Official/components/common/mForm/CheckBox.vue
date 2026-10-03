<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   scripts/_prototype.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。 */

import './.css/variables.css'
import './.css/selectionVariables.css'
import './.css/checkboxVariables.css'
import './.css/common.css'
import './.css/selection.css'
import './.css/checkbox.css'
import './.css/styleProject.css'

import useValidateEvents from './.composables/useValidateEvents.js'
import { useConfigOptions } from './.composables/useConfigOptions.js'

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
      /* 要掛在元素上的屬性,依位置各一組 —— 位置名與 setClass 同一套
        (能傳 class 的地方就能傳屬性),例如 { type: { 'data-x': 'y' } }。

        有些東西只能靠元素上的屬性做到:難字的造字對照、無障礙的標記、
        第三方套件用屬性認元素 —— 那幾種沒辦法用 class 或 slot 代替。

        預設是空的,傳進來才掛。 */
      attr: {},
      validateEvents: ['touchedModelUpdate'],
      /* 這個欄位是一組多選,還是單獨一格。

        名字講的是**幾個選項**,不是值長什麼樣 —— 單獨一格送什麼值
        由下面那兩個設定決定,true / false 只是它的預設。
        (先前這個值叫 boolean,那把值的型別寫進了模式名:
        自訂成 'Y' / 'N' 之後,設定讀起來就與行為對不上了。) */
      mode: 'group', // 'group' | 'single'
      /* 單一勾選框(boolean 模式)勾起來與取消時,各送什麼值出去。

        預設是 true / false。後端收的是 'Y' / 'N' 那種欄位時填成那兩個值 ——
        不然轉換只能寫在每一個使用端,而同一份資料就存了兩種形狀,
        要靠人記得兩邊一致。

        group 模式不看這兩個:那一種送的是選中的那幾格的值本身。 */
      checkedValue: true,
      uncheckedValue: false,
      sort: null, // null | 'desc' (大到小) | 'asc' (小到大)
      label: null,
      value: null, // group 用
      align: 'top',
      /* 勾起來的時候畫哪一支圖示,**留空就不畫**。

        圖示的名字每個專案都不一樣(各站的 _svg 裡叫什麼由那個站決定),
        所以是設定而不是寫死在畫面區段裡 —— 寫死的話換一個專案要改元件本身,
        而那一段跟著來源覆蓋:改完下一次更新就被蓋回去。 */
      checkIcon: 'icon_check_solid',
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

/* 這幾個設定只能填固定的值 —— 填了別的不會報錯,
   而元件每一條分支都對不上,那一段就靜靜地不作用。 */
useConfigOptions(config, {
  mode: ['group', 'single'],
  sort: [null, 'desc', 'asc'],
})

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

    /* 原樣回傳 —— 勾起來送什麼由 checkedValue 決定,不一定是布林。
      轉成布林的話,'N' 這種「取消」的值會被當成勾起來。 */
    return props.modelValue
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
  if (config.value.mode !== 'group') return model.value === config.value.checkedValue

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
    mode === 'group'
      ? Array.isArray(model.value) && model.value.includes(value)
      : model.value === config.value.checkedValue

  const onChecked = (next) => {
    if (mode !== 'group') {
      model.value = next ? config.value.checkedValue : config.value.uncheckedValue
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
  <div class="m-form" :class="setClass.main" v-bind="config.attr.main">
    <Field
      :name="props.name"
      type="checkbox"
      :value="config.mode === 'group' ? config.value : config.checkedValue"
      :uncheckedValue="config.mode === 'boolean' ? config.uncheckedValue : undefined"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
      v-slot="{ field, errorMessage }"
    >
      <div
        class="m-form-container --checkbox"
        :class="[{ '--no-label': !config.label }, setClass.container]"
        v-bind="config.attr.container"
      >
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
          v-bind="config.attr.element"
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

          <CommonMSvgIcon
            :icon="config.checkIcon"
            class="m-form-icon"
            :class="setClass.icon"
            v-bind="config.attr.icon"
            v-if="config.checkIcon"
          />

          <slot>
            <em
              class="m-form-label"
              :class="setClass.label"
              v-bind="config.attr.label"
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
      v-bind="config.attr.error"
      v-slot="{ message }"
    >
      <CommonMErrorMessage :message="message" />
    </ErrorMessage>
  </div>
</template>
