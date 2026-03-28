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
    type: [Array, Boolean, String],
    default: undefined,
  },
  modelModifiers: {
    type: Object,
    default: () => ({}),
  },
  rules: {
    type: [String, Object, Function],
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

const config = computed(() => {
  return onDeepMerge(
    {
      mode: 'group', // 'group' | 'boolean'
      sort: null, // null | 'desc' (大到小) | 'asc' (小到大)
      label: null,
      value: null, // group 用
      align: 'top',
      isDisabled: false,
      isJoin: null, // 只有 group 用
      isValueEmptyClickClear: false,
    },
    props.config
  )
})

const model = computed({
  get() {
    if (config.value.mode === 'group') {
      const sep = joinSep.value
      const currentValue = config.value.value

      if (Array.isArray(props.modelValue)) {
        if (props.modelValue.length === 0 && currentValue === '') {
          return ['']
        }

        return props.modelValue
      }

      if (sep && typeof props.modelValue === 'string') {
        return props.modelValue
          ? props.modelValue
              .split(sep)
              .map((s) => s.trim())
              .filter(Boolean)
          : currentValue === ''
            ? ['']
            : []
      }

      return currentValue === '' ? [''] : []
    }

    return typeof props.modelValue === 'boolean' ? props.modelValue : false
  },
  set(value) {
    if (config.value.mode === 'group') {
      const sep = joinSep.value

      if (!Array.isArray(value)) {
        emits('update:modelValue', sep ? '' : [])
        return
      }

      const sortedValue = onSortGroupValue(value)

      if (sep) {
        emits('update:modelValue', sortedValue.join(sep))
        return
      }

      emits('update:modelValue', sortedValue)
      return
    }

    emits('update:modelValue', Boolean(value))
  },
})

const joinSep = computed(() => {
  if (config.value.mode !== 'group') return null

  const { isJoin } = config.value

  if (isJoin === true) return ','
  if (typeof isJoin === 'string' && isJoin.length) return isJoin

  return null
})

const isEmptyClearItem = computed(() => {
  return (
    config.value.mode === 'group' &&
    config.value.isValueEmptyClickClear === true &&
    config.value.value === ''
  )
})

const setClass = computed(() => {
  return {
    main: '',
    content: '',
    element: '',
    icon: '',
    label: '',
    error: '',
    ...props.setClass,
  }
})

const onSortGroupValue = (list) => {
  if (config.value.mode !== 'group') return list
  if (!Array.isArray(list)) return []

  const { sort } = config.value
  if (!sort) return list

  const nextList = [...list]

  nextList.sort((a, b) => {
    const aNum = Number(a)
    const bNum = Number(b)

    const isANumber = !Number.isNaN(aNum) && a !== '' && a !== null
    const isBNumber = !Number.isNaN(bNum) && b !== '' && b !== null

    // 兩個都可轉數字 -> 用數字排
    if (isANumber && isBNumber) {
      return sort === 'asc' ? aNum - bNum : bNum - aNum
    }

    // 否則用字串排
    const aStr = String(a)
    const bStr = String(b)

    return sort === 'asc'
      ? aStr.localeCompare(bStr, undefined, { numeric: true })
      : bStr.localeCompare(aStr, undefined, { numeric: true })
  })

  return nextList
}

const onChange = () => {
  const { label, value, mode } = config.value

  if (isEmptyClearItem.value) {
    model.value = []
  }

  emits('change', {
    mode,
    label,
    value,
  })
}
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
    <Field
      :name="props.name"
      type="checkbox"
      :value="config.mode === 'group' ? config.value : true"
      :uncheckedValue="config.mode === 'boolean' ? false : undefined"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-slot="{ field, errorMessage }"
    >
      <div class="m-form-container" :class="setClass.container">
        <label
          class="m-form-element --checkbox relative inline-flex gap-x-[6px] leading-[1.4]"
          :class="[
            config.align === 'top' ? 'items-baseline' : 'items-center',
            config.isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
            { '--error': errorMessage },
            setClass.element,
          ]"
        >
          <input
            type="checkbox"
            v-bind="field"
            :value="config.value"
            class="m-form-type jFormValid sr-only"
            :disabled="config.isDisabled"
            @change="onChange"
            v-if="config.mode === 'group'"
          />

          <input
            type="checkbox"
            v-bind="field"
            :value="true"
            :unchecked-value="false"
            class="m-form-type jFormValid sr-only"
            :disabled="config.isDisabled"
            @change="onChange"
            v-else
          />

          <SvgIcon
            icon="icon_check_solid"
            class="m-form-icon relative mt-[2px] h-[20px] w-[20px] shrink-0 self-start rounded-[2px] border-[1px] text-[--green-8b0d] transition-colors duration-300"
            :class="setClass.icon"
          />

          <slot>
            <em class="m-form-label transition-colors duration-300" :class="setClass.label">
              {{ config.label }}
            </em>
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
          @apply border-[--gray-999];
        }
      }

      &:checked {
        & ~ .m-form-label {
          @apply text-[--green-8b0d];
        }

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
