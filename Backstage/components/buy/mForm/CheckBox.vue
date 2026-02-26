<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

import { deepMerge } from '@js/_prototype.js'

import { Field, ErrorMessage } from 'vee-validate'
import { computed } from 'vue'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [Boolean, String, Array],
    default: false,
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
  set(value) {
    emits('update:modelValue', value)
  },
})

const config = computed(() => {
  return deepMerge(
    {
      label: null,
      value: null,
      align: 'top',
      isDisabled: false,
      schema: {
        key: 'key',
        value: 'value',
      },
    },
    props.config
  )
})

const bind = computed(() => {
  const { value } = config.value
  const isTrueFalseValue = !Array.isArray(props.modelValue) && typeof value === 'object'

  return isTrueFalseValue
    ? {
        'true-value': value.true,
        'false-value': value.false,
      }
    : {
        value,
      }
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      elem: '',
      content: '',
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
      type="checkbox"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-slot="{ field, errorMessage }"
    >
      <div class="m-form-container" :class="setClass.container">
        <label
          class="m-form-element --checkbox relative inline-flex gap-x-[8px] text-[--gray-999]"
          :class="[
            config.align === 'top' ? 'items-baseline' : 'items-center',
            config.isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
            setClass.element,
          ]"
        >
          <input
            :name="props.name"
            type="checkbox"
            v-model="model"
            v-bind="bind"
            class="m-form-type jFormValid sr-only"
            :class="{
              '--error': errorMessage,
            }"
            :disabled="config.isDisabled"
            @change="onChange"
          />
          <!-- <i
            class="m-form-icon relative mt-[2px] h-[20px] w-[20px] shrink-0 self-start rounded-[2px] border-[1px] border-[--gray-ccce]"
          /> -->
          <SvgIcon
            icon="icon_check_solid"
            class="m-form-icon relative mt-[3px] h-[18px] w-[18px] shrink-0 self-start rounded-[2px] border-[1px] p-[1px] text-[--orange-e646] transition-colors duration-300"
            :class="setClass.icon"
          />
          <slot>
            <em :class="setClass.label">{{ config.label }}</em>
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
      <ErrorMessageElem class="text-[12px]" :message="message" />
    </ErrorMessage>
  </div>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style lang="postcss">
.m-form-element {
  &.\-\-checkbox {
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
