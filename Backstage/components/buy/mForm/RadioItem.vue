<script setup>
import { onDeepMerge } from '@js/_prototype.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [Boolean, String, Number],
    default: undefined,
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
  get() {
    return props.modelValue
  },

  set(val) {
    emits('update:modelValue', val)
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
  emits('change')
}
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
    <Field
      :name="props.name"
      type="radio"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-slot="{ errorMessage }"
    >
      <div class="m-form-container overflow-hidden" :class="setClass.container">
        <label
          class="m-form-element --radio-item relative flex gap-x-[8px] rounded-[15px] border-[1px] align-middle leading-[1.35] transition-colors duration-300"
          :class="[
            config.align === 'top' && (config.label || $slots.default)
              ? 'items-baseline'
              : 'items-center',
            config.isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
            setClass.element,
            { '--checked': model === config.value },
          ]"
        >
          <input
            :name="props.name"
            type="radio"
            v-model="model"
            :value="config.value"
            class="m-form-type jFormValid sr-only"
            :class="{
              '--error': errorMessage,
            }"
            :disabled="config.isDisabled"
            @change="onChange"
          />
          <CommonSvgIcon
            icon="icon_check_solid"
            class="m-form-icon relative mt-[2px] h-[18px] w-[18px] shrink-0 self-start rounded-full border-[1px] text-[--orange-e646] transition-colors duration-300"
            :class="setClass.icon"
          />
          <div class="grow" :class="setClass.label">
            <slot />
          </div>
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

<style lang="postcss">
.m-form-element {
  &.\-\-radio-item {
    &.\-\-checked {
      @apply border-transparent bg-[--orange-feea];
    }

    .m-form-type {
      &:not(:checked) {
        & + .m-form-icon {
          @apply border-[--gray-ccce];
        }
      }

      &:checked {
        & + .m-form-icon {
          @apply border-transparent;

          > use {
            @apply opacity-100;
          }
        }
      }
    }

    .m-form-icon {
      > use {
        @apply opacity-0 transition-opacity duration-300;
      }
    }
  }
}
</style>
