<script setup>
import { onDeepMerge } from '@js/_prototype.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Array, null],
    default: '',
  },
  rules: {
    type: Object,
    default: null,
  },
  config: {
    type: Object,
    default: () => {},
  },
  setClass: {
    type: Object,
    default: () => {},
  },
})

const model = computed({
  get: () => props.modelValue,
  set(value) {
    emits('update:modelValue', value)
  },
})

const config = computed(() => {
  return onDeepMerge(
    {
      label: null,
      value: null,
      align: 'top',
      isDisabled: false,
    },
    props.config
  )
})

const isChecked = computed(() => {
  const { value } = config.value
  return model.value === value
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      content: '',
      element: '',
      icon: '',
      label: '',
      error: '',
    },
    ...props.setClass,
  }
})

const onChange = () => {
  const { label, value } = config.value
  emits('change', {
    label,
    value,
  })
}
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
    <Field
      :name="props.name"
      type="radio"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-slot="{ field, errorMessage }"
    >
      <div class="m-form-container" :class="setClass.container">
        <label
          class="m-form-element --radio relative inline-flex gap-x-[6px] leading-[1.4] p:text-[16px]"
          :class="[
            config.align === 'top' ? 'items-baseline' : 'items-center',
            config.isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
            { '--error': errorMessage },
            setClass.element,
          ]"
        >
          <input
            type="radio"
            v-bind="field"
            :value="config.value"
            :checked="isChecked"
            class="m-form-type jFormValid sr-only"
            :disabled="config.isDisabled"
            @change="onChange"
          />
          <i
            class="m-form-icon relative mt-[2px] h-[18px] w-[18px] shrink-0 self-start rounded-full border-[2px] transition-colors duration-300"
            :class="setClass.icon"
          />
          <slot>
            <em class="m-form-label" :class="setClass.label">{{ config.label }}</em>
          </slot>
        </label>
      </div>
    </Field>
    <ErrorMessage
      as="span"
      :name="props.name"
      class="m-form-error block"
      :class="setClass.error"
      v-slot="{ message }"
    >
      <BuyMErrorMessageElem class="text-[12px]" :message="message" />
    </ErrorMessage>
  </div>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style lang="postcss">
.m-form-element {
  &.\-\-radio {
    .m-form-type {
      &:not(:checked) {
        & + .m-form-icon {
          @apply border-[--gray-999];
        }
      }

      &:checked {
        & ~ .m-form-label {
          @apply text-[--green-8b0d];
        }

        & + .m-form-icon {
          @apply border-[--green-8b0d];

          &:before {
            @apply opacity-100;
          }
        }
      }
    }

    .m-form-icon {
      &:before {
        @apply pointer-events-none absolute left-[2px] top-[2px] h-[10px] w-[10px] rounded-full bg-[--green-8b0d] opacity-0 transition-opacity duration-300 content-default;
      }
    }
  }
}
</style>
