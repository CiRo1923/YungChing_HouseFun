<script setup>
import '@css/_modules/buy/mTag/variables.css'
import '@css/_modules/buy/mTag/checkboxVariables.css'
import '@css/_modules/buy/mTag/common.css'
import '@css/_modules/buy/mTag/checkbox.css'

import { onDeepMerge } from '@js/_prototype.js'

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
  return onDeepMerge(
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
    class="m-tag --checkbox"
    :class="[{ '--checked': hasChecked }, { '--disabled': config.isDisabled }, setClass.main]"
  >
    <input
      :name="props.name"
      type="checkbox"
      v-model="model"
      :value="config.value"
      class="m-tag-type"
      :disabled="config.isDisabled"
      @change="onChange"
    />
    <span class="m-tag-assist">
      <CommonSvgIcon icon="icon_check_solid" class="m-tag-icon" :class="setClass.icon" />
      <small class="m-tag-assist-label" v-if="config.assist !== null">
        {{ config.assist }}
      </small>
    </span>
    <slot>
      <em class="m-tag-label" :class="setClass.label">{{ config.label }}</em>
    </slot>
  </label>
</template>
