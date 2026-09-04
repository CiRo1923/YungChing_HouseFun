import { onDeepMerge, onDeepClone } from '@js/_prototype.js'

export const addIdenticalConfigDefault = {
  // 0 可以全部刪除;{number} 最少要留 {number} 個
  keepDelItems: 0,
  // 按下「新增」時複製進陣列的那一份;沒給就 push 空陣列
  defaultData: null,
  anchor: {
    text: null,
    icon: {
      position: 'left',
      name: 'icon_plus_circle',
    },
  },
}

export const addIdenticalSetClassDefault = {
  main: '',
  container: '',
  item: '',
  anchor: '',
  // 字級由使用端決定 —— 這支是複用型元件,module 不定 text-*
  anchorText: '',
}

export const useAddIdenticalCore = ({
  props,
  emits,
  config: defaultConfig = {},
  setClass: defaultSetClass = {},
}) => {
  const model = computed({
    get: () => props.modelValue,
    set: (value) => {
      emits('update:modelValue', value)
    },
  })

  const config = computed(() => {
    return onDeepMerge(
      {
        ...addIdenticalConfigDefault,
        ...defaultConfig,
      },
      props.config
    )
  })

  const setClass = computed(() => {
    return {
      ...addIdenticalSetClassDefault,
      ...defaultSetClass,
      ...props.setClass,
    }
  })

  // defaultData 一定要深拷貝 —— 直接 push 進去的話每一筆都是同一個物件的參照,
  // 改其中一筆會連動改到全部
  const onAddClick = () => {
    const { defaultData } = config.value

    model.value.push(onDeepClone(defaultData || []))
  }

  const onRemoveClick = (index) => {
    model.value.splice(index, 1)
  }

  return {
    model,
    config,
    setClass,
    onAddClick,
    onRemoveClick,
  }
}
