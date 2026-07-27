import { computed, ref } from 'vue'
import { onDeepMerge } from '@js/_prototype.js'

// Input / AutoComplete 共用的文字輸入樣板:聚焦狀態、config 合併、setClass 合併。
// - config:以 onDeepMerge 深層合併(第一參傳 {} 避免污染 defaultConfig)
// - setClass:各欄位皆為 class 字串,淺層 spread 合併即可
// 各元件傳入自己的 defaultConfig / defaultSetClass(欄位不同),行為保持與原本一致。
export const useInputTextCore = (props, { defaultConfig = {}, defaultSetClass = {} } = {}) => {
  const isFocus = ref(false)

  const config = computed(() => onDeepMerge({}, defaultConfig, props.config ?? {}))
  const setClass = computed(() => ({ ...defaultSetClass, ...(props.setClass ?? {}) }))

  return {
    isFocus,
    config,
    setClass,
  }
}
