<script setup>
import './.css/variables.css'
import './.css/searchVariables.css'
import './.css/common.css'
import './.css/search.css'

import { useInputTextCore } from './.composables/useInputTextCore.js'

const emits = defineEmits(['update:modelValue', 'input', 'enter'])

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
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const defaultConfig = {
  placeholder: '',
  hasClearButton: true,
  // 按 enter 就送出搜尋。關掉的話 enter 不發事件,由使用端自己決定什麼時候搜
  isEnterSearch: true,
}
const defaultSetClass = {
  main: '',
  container: '',
  element: '',
  type: '',
}
const { isFocus, config, setClass } = useInputTextCore(props, {
  defaultConfig,
  defaultSetClass,
})

const model = computed({
  get: () => props.modelValue ?? '',
  set: (value) => {
    emits('update:modelValue', value)
  },
})

const onInput = (e) => {
  model.value = e.target.value
  emits('input', e)
}

/* 事件名用 enter,不是 keydown.enter —— 在元件上寫 @keydown.enter 時,
   Vue 會把它編成原生按鍵事件加上按鍵修飾詞,接不到名為 'keydown.enter' 的 emit。
   那種寫法只會靠原生事件冒泡到根元素才誤打誤撞觸發,
   而這裡的 preventDefault 對它沒有作用:表單仍然會被按 enter 送出。 */
const onEnter = (e) => {
  if (!config.value.isEnterSearch) return

  e.preventDefault()
  emits('enter', e)
}

const onClear = () => {
  model.value = ''
}

const onFocus = (value) => {
  isFocus.value = value
}
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <div class="m-form-container" :class="setClass.container">
      <div class="m-form-element --search" :class="[setClass.element, { '--focus': isFocus }]">
        <input
          :id="props.name"
          :type="props.type"
          :value="model"
          class="m-form-type"
          :class="setClass.type"
          :placeholder="config.placeholder"
          autocomplete="off"
          @focusin="onFocus(true)"
          @blur="onFocus(false)"
          @input="onInput($event)"
          @keydown.enter="onEnter($event)"
        />
        <button
          v-if="config.hasClearButton"
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
        <CommonMSvgIcon icon="icon_search" class="m-form-search-icon" />
      </div>
    </div>
  </div>
</template>
