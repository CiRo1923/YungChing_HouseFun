<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

import { onDeepMerge } from '@js/_prototype.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [Boolean, String, Array],
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
    const { mode } = config.value
    // value/boolean：完全不要轉 array
    if (mode !== 'group') return props.modelValue

    // group：input 端永遠 array
    const sep = joinSep.value

    if (Array.isArray(props.modelValue)) return props.modelValue

    // join 模式才從字串切回 array
    if (sep && typeof props.modelValue === 'string') {
      return props.modelValue
        ? props.modelValue
            .split(sep)
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    }

    // group 但外部給了字串（例如 '1'/'10'）→ 你要嘛當成單選 group，就包成 array
    if (typeof props.modelValue === 'string') return [props.modelValue]

    return []
  },

  set(val) {
    const { mode } = config.value
    // value/boolean：原樣吐回（或由 true/false-value 控制）
    if (mode !== 'group') {
      emits('update:modelValue', val)
      return
    }

    // group：可 join 才 join
    const sep = joinSep.value
    if (sep && Array.isArray(val)) {
      emits('update:modelValue', val.join(sep))
      return
    }

    emits('update:modelValue', val)
  },
})

const config = computed(() => {
  return onDeepMerge(
    {
      mode: 'group', // 'boolean' | 'group' | 'value'
      label: null,
      value: null,
      align: 'top',
      isDisabled: false,
      isJoin: null,
    },
    props.config
  )
})

const joinSep = computed(() => {
  const { mode, isJoin } = config.value
  if (mode !== 'group') return null

  if (isJoin === true) return ','
  if (typeof isJoin === 'string' && isJoin.length) return isJoin
  return null
})

const bind = computed(() => {
  const { mode, value } = config.value

  // value / boolean：用 true-value/false-value 才不會變 boolean
  if (mode === 'value') {
    return {
      'true-value': value?.true, // 勾選回傳 '1' / '10'
      'false-value': value?.false, // 取消回傳 ''（你要 null 也可以）
    }
  }

  if (mode === 'boolean') {
    return {
      'true-value': true,
      'false-value': false,
    }
  }

  // group：用 value 做 array 比對
  return { value }
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
