<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   assets/css/_common/vueTransition.css
     轉場動畫定義在這裡。沒有它不會報錯也不會少畫面,只是切換的當下直接跳、沒有漸變。
   scripts/_validation.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。 */
import './.css/variables.css'
import './.css/selectVariables.css'
import './.css/common.css'
import './.css/select.css'
import './.css/styleProject.css'

import { onMergeDropdownConfig, useDropdownCore } from './.composables/useDropdownCore.js'
import useValidateEvents from './.composables/useValidateEvents.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number, Boolean, Object],
    default: null,
  },
  config: {
    type: Object,
    default: () => {},
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

const selectRef = ref(null)
const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    emits('update:modelValue', value)
  },
})
const config = computed(() => {
  const defaultConfig = {
    // 驗證時機。blur / change 一律驗;值一動就驗只在「碰過之後」才生效
    // (touchedModelUpdate 的用意見 .composables/useValidateEvents.js)。
    // 傳陣列為「完整指定」,沒列到的一律關閉。
    /* 要掛在元素上的屬性,依位置各一組 —— 位置名與 setClass 同一套
        (能傳 class 的地方就能傳屬性),例如 { type: { 'data-x': 'y' } }。

        有些東西只能靠元素上的屬性做到:難字的造字對照、無障礙的標記、
        第三方套件用屬性認元素 —— 那幾種沒辦法用 class 或 slot 代替。

        預設是空的,傳進來才掛。 */
    attr: {},
    validateEvents: ['blur', 'change', 'touchedModelUpdate'],
    placeholder: null,
    isError: false,
  }

  return onMergeDropdownConfig(props.config, defaultConfig)
})
const validateOn = useValidateEvents(
  () => config.value.validateEvents,
  () => props.name
)

const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      suffix: '',
      error: '',
      dropdown: '',
      dropdownContainer: '',
      icon: '',
    },
    ...props.setClass,
  }
})

const placeholder = computed(() => {
  const { placeholder } = config.value
  const isObject = placeholder && typeof placeholder !== 'string'

  return isObject
    ? placeholder
    : {
        value: placeholder,
        isToOption: false,
      }
})

const {
  elementRef,
  dropdownRef,
  dropdownContainerRef,
  dropdownBodyRef,
  isFocus,
  isActive,
  onSwitchActive,
  onCloseDropdown,
  onElementClick,
  onSelectResize,
  onDropdownHeightUpdate,
  isDropdownOutside,
} = useDropdownCore({
  config,
  // 收起下拉時標記「碰過」—— 綁 Field 的那個隱藏欄位永遠不會 blur
  fieldName: () => props.name,
})

const onDropdownEnter = () => {
  const $selectRef = selectRef.value

  onSwitchActive(false)
  $selectRef?.blur()
}

const onOutSide = (e) => {
  if (isDropdownOutside(e)) {
    onSwitchActive(false)
  }
}

onMounted(() => {
  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onSelectResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onSelectResize)
})

/* 浮層裡「可以捲動的是哪一段」由使用端決定 —— 從插槽傳出去的 bodyRef 綁上它。

  這支元件的浮層內容整塊是插槽:要放幾段、怎麼排都是使用端的事,
  元件看不出哪一段是清單、哪一段是固定的標題或確認列。

  **不綁的話整塊浮層都當成可捲的**,只有一段清單的用法就是這樣,
  既有的使用端一行都不用改。

  浮層裡有固定區塊時一定要綁:算高度與設捲動都會對準整塊,
  中間那段真正可捲的區域分到的高度就多了 —— 清單被截掉一截、或多出一段空白,
  而程式看起來完全正常。

    <CommonMFormSelectDropdown v-slot="{ bodyRef }">
      <p>標題</p>
      <div :ref="bodyRef">清單</div>
      <div v-if="isLast">確認列</div>
    </CommonMFormSelectDropdown>

  用插槽傳出去而不是開一支函式讓使用端呼叫:綁在標籤上不會忘記,
  而呼叫那一種漏掉的時候沒有任何徵兆 —— 高度就是算錯的。 */
defineExpose({
  onClose: onCloseDropdown,
  onDropdownHeight: onDropdownHeightUpdate,
})
</script>

<template>
  <div class="m-form" :class="setClass.main" v-bind="config.attr.main">
    <Field
      :name="props.name"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
      v-slot="{ field, errorMessage }"
    >
      <input type="hidden" :id="props.name" v-bind="field" />
      <div class="m-form-container --select" :class="setClass.container" v-bind="config.attr.container">
        <button
          type="button"
          class="m-form-element --select"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--error': errorMessage || config.isError },
          ]"
          v-bind="config.attr.element"
          :disabled="config.isDisabled"
          ref="elementRef"
          @click="onElementClick()"
          @keypress.enter="onDropdownEnter"
        >
          <em
            class="m-form-type"
            :class="[
              setClass.type,
              {
                '--placeholder': !model,
              },
            ]"
            v-bind="config.attr.type"
            v-html="model || placeholder.value"
            ref="selectRef"
          />
          <CommonMSvgIcon
            :icon="config.arrowIcon"
            class="m-form-icon"
            :class="setClass.icon"
            v-bind="config.attr.icon"
            v-if="config.arrowIcon"
          />
        </button>
        <small
          class="m-form-suffix"
          :class="setClass.suffix"
          v-bind="config.attr.suffix"
          v-if="$slots.suffix"
        >
          <slot name="suffix" />
        </small>
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
  <Teleport to="body">
    <Transition name="anim-collapse" @afterLeave="onCloseDropdown" appear>
      <div
        class="m-form-select-dropdown"
        :class="setClass.dropdown"
        v-bind="config.attr.dropdown"
        ref="dropdownRef"
        v-if="isActive && !config.isDisabled"
      >
        <div
          class="m-form-select-dropdown-container"
          :class="setClass.dropdownContainer"
          v-bind="config.attr.dropdownContainer"
          ref="dropdownContainerRef"
        >
          <!-- bodyRef:浮層裡有固定區塊時,把可捲的那一段綁上它(見 script 的說明) -->
          <slot :bodyRef="dropdownBodyRef" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
