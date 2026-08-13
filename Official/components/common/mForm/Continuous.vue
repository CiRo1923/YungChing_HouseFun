<script setup>
import '@js/_validation.js'

const emits = defineEmits(['update:modelValue', 'complete'])

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  // 驗證碼一律以字串處理(要保留前導 0),故不做 v-model.number 轉換,
  // 宣告此 prop 只是避免修飾符落到 attrs 上。
  modelModifiers: {
    type: Object,
    default: () => ({}),
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  rules: {
    type: Object,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => {},
  },
})

const inputHiddenRef = ref(null)
// 每一格 CommonMFormInput 的元件實例(由 Input.vue 的 defineExpose 提供 focus / select / blur)
const inputRefs = ref([])

// modelValue 是單一字串,拆成每格一字(不足補空字串)供各欄位顯示
const values = computed(() => {
  const text = String(props.modelValue ?? '')

  return Array.from({ length: config.value.length }, (_, index) => text[index] ?? '')
})

const config = computed(() => {
  return {
    length: 6,
    isReadonly: false,
    isDisabled: false,
    isError: false,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    container: '',
    error: '',
    errorMessage: '',
    ...props.setClass,
  }
})

const onSetInputRef = (element, index) => {
  inputRefs.value[index] = element
}

const onFocusAt = (index) => {
  const input = inputRefs.value[index]

  input?.focus()
  input?.select()
}

// 全部填滿 → 收鍵盤並通知外層(可用於自動送出)
const onFinish = (result) => {
  inputRefs.value[config.value.length - 1]?.blur()
  emits('complete', result)
}

// 點進任一格就選取內容,讓已有值的格子可以直接打字覆寫
// (每格 maxlength 是 1,不先選取的話輸入會被擋掉)
const onFocusIn = (index) => {
  inputRefs.value[index]?.select()
}

// 必須聽原生 input:Input.vue 的 update:modelValue 只在 blur 時發出,
// 用它跳格會變成「離開欄位才跳」。
const onInput = async (index, event) => {
  // 只留數字;覆寫時可能拿到兩個字,取最後輸入的那個
  const char = String(event.target?.value ?? '')
    .replace(/\D/g, '')
    .slice(-1)
  const next = [...values.value]

  next[index] = char

  const result = next.join('')

  emits('update:modelValue', result)

  // 清空(退格)時不跳格,讓使用者留在原地繼續刪
  if (!char) return

  await nextTick()

  if (index + 1 < config.value.length) {
    onFocusAt(index + 1)
    return
  }

  onFinish(result)
}

// 貼上整組驗證碼(常見情境:從簡訊複製)。每格 maxlength 是 1,
// 原生貼上只會進 1 個字,故攔下來自行拆開填滿。
const onPaste = async (event) => {
  const text = String(event.clipboardData?.getData('text') ?? '').replace(/\D/g, '')

  if (!text) return

  event.preventDefault()

  const { length } = config.value
  // 一律從第一格開始填 —— 貼上的通常是完整的一組碼
  const next = Array.from({ length }, (_, index) => text[index] ?? '')
  const result = next.join('')

  emits('update:modelValue', result)

  await nextTick()

  const emptyIndex = next.findIndex((char) => !char)

  if (emptyIndex === -1) {
    onFinish(result)
    return
  }

  onFocusAt(emptyIndex)
}

// 空格按退格時跳回前一格。Input.vue 只 emit enter,
// 故在容器攔冒泡上來的 keydown。
const onKeydown = (event) => {
  if (event.key !== 'Backspace') return
  if (event.target.value) return

  const index = inputRefs.value.findIndex((input) => input?.inputRef === event.target)

  if (index <= 0) return

  event.preventDefault()
  onFocusAt(index - 1)
}

defineExpose({
  name: computed(() => inputHiddenRef.value?.name),
  config: computed(() => config.value),
})
</script>

<template>
  <!-- keydown / paste 綁在這裡:Hidden 是單根元件,未宣告的事件會 fallthrough
       到它的根 div,各欄位的事件冒泡上來一樣收得到,不必多包一層 -->
  <CommonMFormHidden
    :name="props.name"
    :modelValue="props.modelValue"
    :config="{
      length: config.length,
    }"
    :rules="props.rules"
    :setClass="{
      main: setClass.main,
      container: ['flex items-center justify-center', setClass.container],
    }"
    @keydown="onKeydown"
    @paste="onPaste"
    v-slot="{ isError }"
    ref="inputHiddenRef"
  >
    <CommonMFormInput
      :ref="(element) => onSetInputRef(element, index)"
      :name="`${props.name}_${item}`"
      :modelValue="values[index]"
      :config="{
        inputMode: 'numeric',
        length: 1,
        hasClearButton: false,
        inputChinese: true,
        integer: true,
        isReadonly: config.isReadonly,
        isDisabled: config.isDisabled,
        isError: config.isError || isError,
      }"
      :setClass="{
        main: '--h-50 --px-12 --rounded',
        type: 'text-center',
      }"
      @input="onInput(index, $event)"
      @focusin="onFocusIn(index)"
      v-for="(item, index) in config.length"
      :key="`${props.name}_${item}`"
    />
  </CommonMFormHidden>
</template>

<style lang="postcss"></style>
