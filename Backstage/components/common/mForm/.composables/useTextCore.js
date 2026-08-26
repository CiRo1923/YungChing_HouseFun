import { onDeepMerge } from '@js/_prototype.js'

export const textConfigDefault = {
  placeholder: '',
  hasClearButton: true,
}

export const textSetClassDefault = {
  main: '',
  container: '',
  element: '',
  type: '',
}

export const useTextCore = ({
  props,
  emits,
  model: sourceModel = null,
  config: defaultConfig = {},
  setClass: defaultSetClass = {},
  emptyValue = '',
}) => {
  const model =
    sourceModel ||
    computed({
      get: () => props.modelValue ?? emptyValue,
      set: (value) => {
        emits('update:modelValue', value)
      },
    })

  const config = computed(() => {
    return onDeepMerge(
      {
        ...textConfigDefault,
        ...defaultConfig,
      },
      props.config
    )
  })

  const setClass = computed(() => {
    return {
      ...textSetClassDefault,
      ...defaultSetClass,
      ...props.setClass,
    }
  })

  const onInput = (e) => {
    model.value = e.target.value
    emits('input', e)
  }

  const onEnter = (e) => {
    e.preventDefault()
    emits('keydown.enter', e)
  }

  const onClear = () => {
    model.value = emptyValue
  }

  return {
    model,
    config,
    setClass,
    onInput,
    onEnter,
    onClear,
  }
}
