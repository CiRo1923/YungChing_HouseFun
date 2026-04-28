<script setup>
import { onDeepMerge } from '@js/_prototype.js'

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
  modelModifiers: {
    type: Object,
    default: () => ({}),
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

const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    let result = value

    if (props.cityModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:modelValue', result)
  },
})

const config = computed(() => {
  const defaultConfig = {
    isDisabled: false,
    isError: false,
  }

  return onDeepMerge(defaultConfig, props.config)
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      error: '',
    },
    ...props.setClass,
  }
})
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <Field
      :name="props.name"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-slot="{ field }"
    >
      <input type="hidden" :id="props.name" v-bind="field" />
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

<style src="@css/_modules/buy/mForm.css"></style>
<style lang="postcss"></style>
