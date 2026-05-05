<script setup>
const emits = defineEmits(['update:modelValue', 'blur', 'remove'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  modelModifiers: {
    type: Object,
    default: () => ({}),
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

const typeRef = ref(null)
const mirrorRef = ref(null)
const model = ref(props.modelValue)
const blurValue = ref(props.modelValue)
const isFocus = ref(false)
const inputWidth = ref(null)

const config = computed(() => {
  return {
    placeholder: '',
    minWidth: 16,
    maxWidth: null,
    isDisabled: false,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    icon: '',
    ...props.setClass,
  }
})

const hasValue = computed(() => {
  return model.value !== null && model.value !== undefined && `${model.value}`.trim() !== ''
})

const hasCheckValue = computed(() => {
  return (
    !isFocus.value &&
    blurValue.value !== null &&
    blurValue.value !== undefined &&
    `${blurValue.value}`.trim() !== ''
  )
})

const getRootFontSize = () => {
  if (typeof window === 'undefined') return 16

  return Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16
}

const toRemWidth = (value) => {
  if (typeof value === 'number') return `${value / getRootFontSize()}rem`
  if (typeof value !== 'string') return value

  const width = value.trim()

  if (width.endsWith('px')) return `${Number.parseFloat(width) / getRootFontSize()}rem`

  return width
}

const toPxNumber = (value) => {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 16

  const width = value.trim()

  if (width.endsWith('rem')) return Number.parseFloat(width) * getRootFontSize()

  return Number.parseFloat(width) || 16
}

const inputMaxWidth = computed(() => {
  const { maxWidth } = config.value
  const value = maxWidth ?? 200

  return toRemWidth(value)
})

const inputMinWidth = computed(() => {
  const { minWidth } = config.value
  const value = minWidth ?? 16

  return toRemWidth(value)
})

const inputMinWidthNumber = computed(() => {
  const { minWidth } = config.value

  return toPxNumber(minWidth ?? 16)
})

const inputMinWidthStyle = computed(() => {
  return hasValue.value ? null : inputMinWidth.value
})

const mirrorText = computed(() => {
  if (hasValue.value) return `${model.value}`

  return config.value.placeholder || ''
})

const onUpdateInputWidth = async () => {
  await nextTick()

  if (!typeRef.value || !mirrorRef.value) return

  const inputStyle = window.getComputedStyle(typeRef.value)

  mirrorRef.value.style.font = inputStyle.font
  mirrorRef.value.style.fontSize = inputStyle.fontSize
  mirrorRef.value.style.fontWeight = inputStyle.fontWeight
  mirrorRef.value.style.fontFamily = inputStyle.fontFamily
  mirrorRef.value.style.letterSpacing = inputStyle.letterSpacing
  mirrorRef.value.style.textTransform = inputStyle.textTransform

  const minWidth = hasValue.value ? 0 : inputMinWidthNumber.value

  inputWidth.value = toRemWidth(Math.max(mirrorRef.value.scrollWidth + 2, minWidth))
}

const onBlur = () => {
  isFocus.value = false

  let result = model.value

  if (props.modelModifiers?.number) {
    result = model.value === '' ? null : Number(model.value)
  }

  blurValue.value = result
  emits('update:modelValue', result)
  emits('blur', result)
}

const onFocus = () => {
  isFocus.value = true
}

const onClear = () => {
  model.value = ''
  onUpdateInputWidth()
}

const onRemove = () => {
  emits('remove')
}

watch(
  () => props.modelValue,
  (value) => {
    model.value = value
    blurValue.value = value
  }
)

watch(
  inputMinWidth,
  (value) => {
    inputWidth.value = value
  },
  {
    immediate: true,
  }
)

watch([mirrorText, inputMinWidth], onUpdateInputWidth, {
  immediate: true,
})

onMounted(() => {
  onUpdateInputWidth()
  window.addEventListener('resize', onUpdateInputWidth)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onUpdateInputWidth)
})
</script>

<template>
  <label
    class="m-tag --custom relative"
    :class="[
      {
        '--disabled': config.isDisabled,
        '--focus': isFocus,
        '--value': hasValue,
      },
      setClass.main,
    ]"
  >
    <CommonSvgIcon
      icon="icon_check_solid"
      class="m-tag-icon h-full w-[15px] text-[--orange-e646] transition-opacitys duration-300"
      :class="setClass.icon"
      v-if="hasCheckValue"
    />
    <CommonSvgIcon
      icon="icon_plus_circle"
      class="m-tag-icon h-full w-[15px] transition-opacitys duration-300"
      :class="setClass.icon"
      v-if="!isFocus && !hasValue"
    />
    <div class="m-tag-element">
      <input
        :name="props.name"
        v-model="model"
        type="text"
        class="m-tag-type bg-transparent"
        :placeholder="config.placeholder"
        :style="{
          width: inputWidth,
          minWidth: inputMinWidthStyle,
          maxWidth: inputMaxWidth,
        }"
        :disabled="config.isDisabled"
        @focus="onFocus"
        @blur="onBlur"
        ref="typeRef"
      />
      <button
        type="button"
        class="m-tag-clear-button"
        :class="{
          '--show': model,
        }"
        tabindex="-1"
        @mousedown.prevent.stop
        @click.stop="onClear"
        v-if="!config.isDisabled && isFocus"
      >
        <CommonSvgIcon icon="icon_xmark" class="m-tag-clear-icon h-[10px] w-[10px]" />
      </button>
    </div>
    <button
      type="button"
      class="m-tag-clear-button"
      tabindex="-1"
      @mousedown.prevent.stop
      @click.stop="onRemove"
      v-if="!config.isDisabled && hasCheckValue"
    >
      <CommonSvgIcon icon="icon_xmark_circle" class="m-tag-remove-icon h-[15px] w-[15px]" />
    </button>
    <span
      class="m-tag-mirror pointer-events-none invisible absolute whitespace-pre"
      ref="mirrorRef"
    >
      {{ mirrorText || ' ' }}
    </span>
  </label>
</template>

<style src="@css/_modules/buy/mTag.css" />
<style lang="postcss">
.m-tag {
  &.\-\-custom {
    @apply border-[1px] bg-transparent;

    &:not(.\-\-value):not(.\-\-focus) {
      @apply border-dashed border-[--gray-ccce];
    }

    &.\-\-value {
      @apply border-transparent bg-[--orange-feea];
    }

    &.\-\-focus {
      @apply border-solid border-[--green-6a2d] bg-transparent;
    }
  }
}

.m-tag-type {
  &::placeholder {
    @apply transition-colors duration-300;
  }
}

@screen p {
  .m-tag {
    &.\-\-custom {
      &:not(.\-\-value):not(.\-\-focus) {
        &:hover {
          @apply border-transparent bg-[--green-8b0d] text-[--white];

          .m-tag-type {
            &::placeholder {
              @apply text-[--white];
            }
          }
        }
      }
    }
  }
}
</style>
