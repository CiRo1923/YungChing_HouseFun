<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/common.css'
import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

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

const setClass = computed(() => {
  return {
    main: '',
    container: '',
    error: '',
    errorMessage: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="m-form-hidden" :class="setClass.main">
    <Field
      :name="`${props.name}_hidden`"
      :modelValue="props.modelValue"
      :rules="props.config.isDisabled ? '' : props.rules"
      v-slot="{ field, errorMessage }"
    >
      <input type="hidden" :id="`${props.name}_hidden`" v-bind="field" />
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
