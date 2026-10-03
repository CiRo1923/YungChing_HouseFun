<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   scripts/_prototype.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。 */
import './.css/variables.css'
import './.css/common.css'

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
    class="m-time"
    :class="[
      { '--cursor-pointer': config.as === 'label' },
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
      class="m-time-type"
      :disabled="isDisabled"
      @change="onChange"
      v-if="config.as === 'label'"
    />
    <CommonMSvgIcon
      icon="icon_check_solid"
      class="m-time-icon --checked"
      :class="setClass.icon"
      v-if="hasChecked"
    />
    <CommonMSvgIcon
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
