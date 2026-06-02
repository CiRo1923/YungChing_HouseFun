<script setup>
import { onDeepMerge } from '@js/_prototype.js'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  text: {
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
  return onDeepMerge(
    {
      as: 'span', // 'span' || 'label'
      value: null,
      isDisabled: false,
      isLock: false,
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
  const { as, value } = config.value

  return as === 'label' ? model.value.findIndex((item) => item === value) !== -1 : true
})

const isDisabled = computed(() => config.value.isDisabled || config.value.isLock)

const setClass = computed(() => {
  return {
    ...{
      main: '',
      content: '',
      icon: '',
      text: '',
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
  <component
    :is="config.as"
    class="m-time relative inline-flex items-center justify-center gap-x-[3px] rounded-full transition-colors duration-300"
    :class="[
      { 'cursor-pointer': config.as === 'label' },
      { 'cursor-default': config.as === 'span' },
      { '--checked': hasChecked },
      { '--disabled': isDisabled },
      setClass.main,
    ]"
  >
    <input
      :name="props.name"
      type="checkbox"
      v-model="model"
      :value="config.value"
      class="m-time-type sr-only"
      :disabled="isDisabled"
      @change="onChange"
      v-if="config.as === 'label'"
    />
    <CommonSvgIcon
      icon="icon_check_solid"
      class="m-time-icon text-[--orange-e646]"
      :class="setClass.icon"
      v-if="hasChecked"
    />
    <CommonSvgIcon
      icon="icon_lock"
      class="m-time-icon"
      :class="setClass.icon"
      v-if="config.isLock"
    />
    <slot>
      <em class="m-time-label" :class="setClass.text">{{ text }}</em>
    </slot>
  </component>
</template>

<style src="@css/_modules/buy/mTag.css" />
<style lang="postcss">
.m-time {
  &:not(.\-\-disabled) {
    @apply text-[--gray-666];

    &.\-\-checked {
      @apply bg-[--orange-feea];

      .m-time-label {
        @apply font-semibold;
      }
    }

    &:not(.\-\-checked) {
      @apply bg-[--gray-f7];
    }
  }

  &.\-\-disabled {
    @apply cursor-not-allowed bg-[--gray-e5] text-[--gray-999];
  }
}

.m-time-icon {
  @apply h-[16px] w-[16px] p-[2px];
}

@screen p {
  .m-time {
    &.\-\-h-30,
    &.p\:\-\-h-30,
    &.pt\:\-\-h-30 {
      @apply h-[30px];
    }

    &.\-\-w-85,
    &.p\:\-\-w-85,
    &.pt\:\-\-w-85 {
      @apply w-[85px];
    }

    &.\-\-w-80,
    &.p\:\-\-w-80,
    &.pt\:\-\-w-80 {
      @apply w-[80px];
    }

    &.\-\-w-76,
    &.p\:\-\-w-76,
    &.pt\:\-\-w-76 {
      @apply w-[76px];
    }
  }
}

@screen t {
  .m-time {
    &.\-\-h-30,
    &.pt\:\-\-h-30,
    &.tm\:\-\-h-30,
    &.t\:\-\-h-30 {
      @apply h-[30px];
    }

    &.\-\-w-85,
    &.pt\:\-\-w-85,
    &.tm\:\-\-w-85,
    &.t\:\-\-w-85 {
      @apply w-[85px];
    }

    &.\-\-w-80,
    &.pt\:\-\-w-80,
    &.tm\:\-\-w-80,
    &.t\:\-\-w-80 {
      @apply w-[80px];
    }

    &.\-\-w-76,
    &.pt\:\-\-w-76,
    &.tm\:\-\-w-76,
    &.t\:\-\-w-76 {
      @apply w-[76px];
    }
  }
}

@screen m {
  .m-time {
    &.\-\-h-30,
    &.tm\:\-\-h-30,
    &.m\:\-\-h-30 {
      @apply h-[30px];
    }

    &.\-\-w-85,
    &.tm\:\-\-w-85,
    &.m\:\-\-w-85 {
      @apply w-[85px];
    }

    &.\-\-w-80,
    &.tm\:\-\-w-80,
    &.m\:\-\-w-80 {
      @apply w-[80px];
    }

    &.\-\-w-76,
    &.tm\:\-\-w-76,
    &.m\:\-\-w-76 {
      @apply w-[76px];
    }
  }
}
</style>
