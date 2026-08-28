<script setup>
import { countdown, onDeepMerge } from '@js/_prototype.js'

import '@js/_validation.js'

const emits = defineEmits(['update:modelValue', 'submit'])
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
  rules: {
    type: Object,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const timeout = ref(0)
const isTimeout = computed(() => timeout.value === 0)
const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    let result = value

    if (props.modelModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:modelValue', result)
  },
})

const config = computed(() => {
  return onDeepMerge(
    {
      placeholder: null,
      length: null,
      // 驗證時機:本元件不自己驗證,原樣轉給底層的 Input(真正掛 Field 的地方)。
      // null = 沿用全域,詳見 .composables/useValidateEvents.js
      validateEvents: null,
      serverTime: +new Date(),
      expires: null,
      storageName: null,
      format: 'sss',
      autoCountdown: false,
      message: {
        timeout: null,
        reSend: null,
      },
      isDisabled: {
        type: false,
        button: false,
      },
    },
    props.config
  )
})

const timeoutMessage = computed(() => {
  const { message } = config.value
  if (!message.timeout) return ''

  // config.message.timeout 若帶 {timeout} 佔位字,替換成當前倒數秒數
  return message.timeout.replace(/\{\s*timeout\s*\}/g, timeout.value)
})

const setClass = computed(() => {
  return {
    main: '',
    button: '',
    ...props.setClass,
  }
})

// 用指定的到期時間開始倒數（onStart 內部會先 onStop 舊的，等於覆蓋重來）
const onTimeout = (expires) => {
  const { serverTime, storageName } = config.value
  if (!expires) return

  // startTime 帶 config serverTime
  // 沒值時留 undefined，onStart 會 fallback 成 Date.now()
  countdown.onStart({
    startTime: serverTime,
    expireTime: expires,
    format: 'sss',
    storageName,
    onTick: ({ remainingSec }) => {
      timeout.value = remainingSec
    },
    onDone: () => {
      timeout.value = 0
    },
  })
}

const onSubmit = () => {
  emits('submit')
}

// 送出 / 重送拿到新的到期時間 → 用新的重新倒數（覆蓋舊的）
watch(
  () => config.value.expires,
  (expires) => onTimeout(expires)
)

// 掛載時的起算優先序:
// 1. 有 storageName 且上次倒數尚未結束 → 從 localStorage 恢復續倒數(記住時間,重整/回訪不歸零)
// 2. 否則若 autoCountdown 為 true 且 expires 已備妥 → 自動起算
//    (popup 內容是「打開才渲染」,元件在打開當下才掛載,此時 expires 早已設好,
//     lazy watch 不會補觸發初值,故自動起算必須放在元件自身的 onMounted)
onMounted(() => {
  const { storageName, autoCountdown, expires } = config.value

  if (storageName) {
    const saved = countdown.onGet(storageName)
    // 用存下來的絕對到期時間續倒數;onStart 內部以 Date.now() 算剩餘,秒數會接續正確
    if (saved.ok && !saved.isExpired) {
      onTimeout(saved.data.expireMs)
      return
    }
  }

  if (autoCountdown && expires) onTimeout(expires)
})

// 保留 onTimeout 給需要手動控制的頁面（config.autoCountdown 不傳 → 純被動）；
// watch 仍會被動處理之後 expires 的變化（重送）
defineExpose({
  onTimeout,
})
</script>

<template>
  <CommonMFormInput
    :name="props.name"
    v-model="model"
    :config="{
      placeholder: config.placeholder,
      length: config.length,
      validateEvents: config.validateEvents,
      integer: true,
      inputChinese: false,
      isDisabled: config.isDisabled.type,
    }"
    :rules="props.rules"
    :setClass="{
      main: setClass.main,
    }"
  >
    <template #rearAssist>
      <CommonMAnchor
        :text="!isTimeout ? timeoutMessage : config.message.reSend"
        :config="{
          isDisabled: config.isDisabled.button,
        }"
        :setClass="{
          main: [
            setClass.button,
            { '--bg-green-8b0d-66': !isTimeout },
            { '--bg-green-8b0d': isTimeout },
            '--oval --text-white',
          ],
          text: 'text-[14px]',
        }"
        @click="isTimeout ? onSubmit() : null"
      />
    </template>
  </CommonMFormInput>
</template>

<style lang="postcss"></style>
