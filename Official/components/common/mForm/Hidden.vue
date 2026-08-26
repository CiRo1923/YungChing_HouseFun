<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/common.css'
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

const config = computed(() => {
  return {
    length: null,
    minlength: null,
    maxlength: null,
    // 這個欄位要在哪些時機自動驗證。null(不傳)= 沿用 vee-validate 的全域預設,
    // 等同 ['blur', 'change', 'modelUpdate']。
    //
    // ⚠️ 傳陣列是「完整指定」,沒列到的一律不驗 —— 不是在預設值上疊加。
    //    所以 [] 代表只有 submit 時的主動 validate() 會驗,自動驗證全關。
    //    例:清空值不想立刻跳紅字 → ['blur', 'change'](把 modelUpdate 拿掉)
    validateEvents: null,
    ...props.config,
  }
})

const validateOn = useValidateEvents(() => config.value.validateEvents)

const setClass = computed(() => {
  return {
    main: '',
    container: '',
    error: '',
    errorMessage: '',
    ...props.setClass,
  }
})

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
      class="m-form-error"
      :class="setClass.error"
      v-slot="{ message }"
    >
      <CommonMErrorMessageElem :class="setClass.errorMessage" :message="message" />
    </ErrorMessage>
  </div>
</template>
