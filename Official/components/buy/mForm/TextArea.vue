<script setup>
import { onDeepMerge } from '@js/_prototype.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits([
  'update:modelValue',
  'focusin',
  // 'focusout',
  'blur',
  'input',
])

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  value: {
    type: [String, Number],
    default: null,
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
const model = ref(null)
const isFocus = ref(false)
const config = computed(() => {
  return onDeepMerge(
    {
      placeholder: '',
      rows: null,
      length: null,
      minlength: null,
      maxlength: null,
      formatLength: null,
      isReadonly: false,
      isDisabled: false,
      isError: false,
      hasClearButton: true, // 輸入後開啟 X 清除
      inputChinese: true, // 開啟關閉輸入中文
    },
    props.config
  )
})
const formatLength = computed(() => {
  const { formatLength, maxlength } = config.value

  return formatLength && maxlength
    ? formatLength.replace(/\{\s*(length|maxlength)\s*\}/g, (_, key) => {
        return key === 'length' ? (model.value ? String(model.value.length) : 0) : String(maxlength)
      })
    : null
})
const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      formatLength: '',
      frontAssist: '',
      rearAssist: '',
      suffix: '',
      error: '',
    },
    ...props.setClass,
  }
})
const onBind = (field) => {
  const value =
    !props.modelValue && props.value
      ? {
          value: props.value,
        }
      : {}

  return {
    ...field,
    ...value,
  }
}

const onInput = async (e) => {
  const value = e.target.value
  const { inputChinese } = config.value
  const chinese = /[一-龥０-９Ａ-Ｚａ-ｚ～！＠＃＄％︿＆＊（）＿｜｛｝［］＜＞？／＊＼＋－]/g

  await nextTick()

  if (!inputChinese && chinese.test(value)) {
    model.value = value.replace(chinese, '')
  }

  emits('input', e)
}

const onEvent = async (e, errorMessage) => {
  const { type } = e
  const isError = !!errorMessage
  const isFocusIn = type === 'focusin'
  const isBlur = type === 'blur'

  if (isFocusIn || isBlur) {
    isFocus.value = !isFocus.value
  }

  if (isBlur) {
    emits('update:modelValue', model.value)
    // blur 時等 update:modelValue 回填到上層 props 後再 emit，父層 onBlur 才讀得到最新值
    await nextTick()
  }

  emits(type, e, isError)
}

watch(
  () => props.modelValue,
  (value) => {
    model.value = value
  },
  {
    immediate: true,
  }
)
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
    <Field
      v-slot="{ field, errorMessage }"
      v-model="model"
      :name="props.name"
      :rules="config.isDisabled ? '' : props.rules"
    >
      <div class="m-form-container overflow-hidden" :class="setClass.container">
        <div
          class="m-form-element --textarea"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--readonly': config.isReadonly },
            { '--disabled': config.isDisabled },
            { '--error': errorMessage || config.isError },
          ]"
        >
          <div
            v-if="$slots.frontAssist"
            class="m-form-assist shrink-0"
            :class="setClass.frontAssist"
          >
            <slot name="frontAssist" />
          </div>
          <textarea
            class="m-form-type min-w-0 grow"
            :class="setClass.type"
            v-bind="onBind(field)"
            :rows="config.rows"
            :minlength="config.minlength || config.length"
            :maxlength="config.maxlength || config.length"
            :placeholder="config.placeholder"
            :readonly="config.isReadonly"
            :disabled="config.isDisabled"
            autocomplete="off"
            @focusin="onEvent($event)"
            @blur="onEvent($event, errorMessage)"
            @input="onInput($event)"
          />

          <span v-if="formatLength" class="m-form-length shrink-0" :class="setClass.length">
            {{ formatLength }}
          </span>
          <div v-if="$slots.rearAssist" class="m-form-assist shrink-0" :class="setClass.rearAssist">
            <slot name="rearAssist" />
          </div>
        </div>
        <small v-if="$slots.suffix" class="m-form-suffix shrink-0" :class="setClass.suffix">
          <slot
            name="suffix"
            :maxlength="config.length || config.maxlength"
            :length="model ? model.length : 0"
          />
        </small>
      </div>
    </Field>
    <ErrorMessage
      v-slot="{ message }"
      as="span"
      :name="props.name"
      class="m-form-error block"
      :class="setClass.error"
    >
      <BuyMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
</template>
<style src="@css/_modules/buy/mForm.css"></style>
<style lang="postcss">
textarea.m-form-type {
  @apply resize-none;
}

@screen p {
  .m-form {
    &.\-\-resize-x,
    &.p\:\-\-resize-x,
    &.pt\:\-\-resize-x {
      textarea.m-form-type {
        @apply resize-x;
      }
    }

    &.\-\-resize-y,
    &.p\:\-\-resize-y,
    &.pt\:\-\-resize-y {
      textarea.m-form-type {
        @apply resize-y;
      }
    }
  }
}

@screen t {
  .m-form {
    &.\-\-resize-x,
    &.pt\:\-\-resize-x,
    &.tm\:\-\-resize-x,
    &.t\:\-\-resize-x {
      textarea.m-form-type {
        @apply resize-x;
      }
    }

    &.\-\-resize-y,
    &.pt\:\-\-resize-y,
    &.tm\:\-\-resize-y,
    &.t\:\-\-resize-y {
      textarea.m-form-type {
        @apply resize-y;
      }
    }
  }
}

@screen m {
  .m-form {
    &.\-\-resize-x,
    &.tm\:\-\-resize-x,
    &.m\:\-\-resize-x {
      textarea.m-form-type {
        @apply resize-x;
      }
    }

    &.\-\-resize-y,
    &.tm\:\-\-resize-y,
    &.m\:\-\-resize-y {
      textarea.m-form-type {
        @apply resize-y;
      }
    }
  }
}
</style>
