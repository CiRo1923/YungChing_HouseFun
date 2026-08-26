<script setup>
import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'
import useValidateEvents from './.composables/useValidateEvents.js'

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
    default: () => ({}),
  },
  rules: {
    type: Object,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

// length 是 minlength / maxlength 的簡寫，兩者沒指定時才吃它
const config = computed(() => {
  return {
    length: null,
    minlength: null,
    maxlength: null,
    // 驗證時機。null = 沿用全域(等同 ['blur', 'change', 'modelUpdate']);
    // 傳陣列為「完整指定」,詳見 .composables/useValidateEvents.js
    validateEvents: null,
    ...props.config,
  }
})
const validateOn = useValidateEvents(() => config.value.validateEvents)

const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      error: '',
      errorMessage: '',
    },
    ...props.setClass,
  }
})

// 父層要捲到出錯的欄位時，得知道 Field 實際註冊的名稱（帶 _hidden 後綴）
defineExpose({
  name: `${props.name}_hidden`,
})
</script>

<template>
  <div class="m-form-hidden" :class="setClass.main">
    <Field
      :name="`${props.name}_hidden`"
      :modelValue="props.modelValue"
      :rules="props.config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
      v-slot="{ field, errorMessage }"
    >
      <input
        type="hidden"
        :id="`${props.name}_hidden`"
        :minlength="config.minlength || config.length"
        :maxlength="config.maxlength || config.length"
        v-bind="field"
      />
      <div class="m-form-hidden-container" :class="setClass.container">
        <slot :isError="!!errorMessage" />
      </div>
    </Field>
    <ErrorMessage
      as="span"
      :name="`${props.name}_hidden`"
      class="m-form-hidden-error block text-[14px]"
      :class="setClass.error"
      v-slot="{ message }"
    >
      <BuyMErrorMessageElem :class="setClass.errorMessage" :message="message" />
    </ErrorMessage>
  </div>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style lang="postcss"></style>
