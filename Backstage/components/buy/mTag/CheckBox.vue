<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

import { deepMerge } from '@js/_prototype.js'

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

    // 但外部給了字串要轉成 array
    if (typeof props.modelValue === 'string') return [props.modelValue]

    return []
  },

  set(val) {
    // 可 join 才 join
    const sep = joinSep.value
    if (sep && Array.isArray(val)) {
      emits('update:modelValue', val.join(sep))
      return
    }

    emits('update:modelValue', val)
  },
})

const config = computed(() => {
  return deepMerge(
    {
      label: null,
      value: null,
      assist: null,
      isDisabled: false,
      isJoin: null,
    },
    props.config
  )
})

const joinSep = computed(() => {
  const { isJoin } = config.value
  if (isJoin === true) return ','
  if (typeof isJoin === 'string' && isJoin.length) return isJoin
  return null
})

const hasChecked = computed(() => {
  const { value } = config.value

  return model.value.findIndex((item) => item === value) !== -1
})
const setClass = computed(() => {
  return {
    ...{
      main: '',
      content: '',
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
  <label
    class="m-tag --checkbox relative"
    :class="[{ '--checked': hasChecked }, { '--disabled': config.isDisabled }, setClass.main]"
  >
    <input
      :name="props.name"
      type="checkbox"
      v-model="model"
      :value="config.value"
      class="m-tag-type sr-only"
      :disabled="config.isDisabled"
      @change="onChange"
    />
    <span class="m-tag-assist relative h-[15px] w-[12px] shrink-0">
      <SvgIcon
        icon="icon_check_solid"
        class="m-tag-icon absolute right-0 top-0 h-full w-[15px] text-[--orange-e646] transition-opacitys duration-300"
        :class="setClass.icon"
      />
      <small
        class="m-tag-assist-label relative block text-right leading-[1] transition-opacitys duration-300"
        v-if="config.assist !== null"
      >
        {{ config.assist }}
      </small>
    </span>
    <slot>
      <em class="m-tag-label" :class="setClass.label">{{ config.label }}</em>
    </slot>
  </label>
</template>

<style src="@css/_modules/buy/mTag.css" />
<style lang="postcss">
.m-tag {
  &.\-\-checkbox {
    &:not(.\-\-disabled) {
      @apply cursor-pointer;

      &.\-\-checked {
        @apply bg-[--orange-feea];

        .m-tag-icon {
          @apply visible opacity-100;
        }

        .m-tag-assist-label {
          @apply invisible opacity-0;
        }

        .m-tag-label {
          @apply font-semibold;
        }
      }

      &:not(.\-\-checked) {
        @apply bg-[--gray-f2];

        .m-tag-icon {
          @apply invisible opacity-0;
        }

        .m-tag-assist-label {
          @apply visible opacity-100;
        }
      }
    }

    &.\-\-disabled {
      @apply cursor-not-allowed;
    }
  }
}
</style>
