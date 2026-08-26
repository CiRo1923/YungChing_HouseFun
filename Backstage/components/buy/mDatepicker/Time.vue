<script setup>
/* 單一時間選擇。與 Single(日期)是兩支獨立元件,共用 .composables 與同一份樣式。

  有哪幾欄可以選,由 config.format 決定:
    hh:mm:ss  時 / 分 / 秒
    hh:mm     時 / 分
    hh        只有時
    hh:00:00  只有時,輸出補 :00:00
    hh:mm:00  時 / 分,輸出補 :00

  config 的鍵見 .composables/useConfig.js。 */

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'
import useValidateEvents from '../../common/mForm/.composables/useValidateEvents.js'

import { onFormatTime, onParseTime, onParseTimeFormat } from './.composables/useTimeCore.js'
import { onMergeTimeConfig } from './.composables/useConfig.js'
import { usePosition } from './.composables/usePosition.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const emits = defineEmits([
  'update:modelValue',
  'selected',
  'focusin',
  'focusout',
  'input',
  'keydown.enter',
])

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Date, Number, null],
    default: '',
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  rules: {
    type: [String, Object],
    default: null,
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => onMergeTimeConfig(props.config))
const validateOn = useValidateEvents(() => config.value.validateEvents)

const containerRef = ref(null)
const iconRef = ref(null)
const panelRef = ref(null)

const isFocus = ref(false)
const isActive = ref(false)
const isDeviceM = computed(() => device.value === 'm')

const isPopup = computed(() => isDeviceM.value && config.value.mobileSupport)

const model = computed({
  get: () => props.modelValue,
  set: (value) => emits('update:modelValue', value),
})

// 面板上目前停的值。model 空的時候依 defaultIsNow 決定要不要帶現在時間
const time = ref({ hour: 0, minute: 0, second: 0 })

const onGetNow = () => {
  const now = new Date()

  return { hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() }
}

const onSyncFromModel = () => {
  const parsed = onParseTime(model.value)

  if (parsed) {
    time.value = parsed
    return
  }

  time.value = config.value.defaultIsNow ? onGetNow() : { hour: 0, minute: 0, second: 0 }
}

// 畫面上顯示的字串。model 有值就照 format 正規化一次,免得存進來的精度與 format 不同
const timeModel = computed(() => {
  if (model.value == null || model.value === '') {
    return config.value.defaultIsNow ? onFormatTime(time.value, config.value.format) : ''
  }

  const parsed = onParseTime(model.value)

  return parsed ? onFormatTime(parsed, config.value.format) : String(model.value)
})

// 只有一欄可選時(format 是 hh 或 hh:00:00),選完就沒別的可選了,直接收起來
const editableCount = computed(
  () => onParseTimeFormat(config.value.format).parts.filter((part) => part.editable).length
)

const setClass = computed(() => ({
  main: '',
  input: {
    main: '',
    elem: '',
    container: '',
    label: '',
    type: '',
    suffix: '',
    aide: '',
    error: '',
  },
  ...props.setClass,
}))

const { onOpen, onClickOutside, onResizeDone } = usePosition(config, isPopup, {
  container: containerRef,
  icon: iconRef,
  panel: panelRef,
})

const onToggle = (value) => {
  isActive.value = value !== undefined ? value : !isActive.value
  isFocus.value = isActive.value
}

const onInputPointerdown = (e) => {
  if (config.value.altInput) return

  e.preventDefault()
  e.stopPropagation()
  onSyncFromModel()
  onToggle(true)
}

const onInputClick = () => {
  if (!config.value.altInput || isActive.value) return

  onToggle(true)
  onSyncFromModel()
}

const onIconPointerdown = (e) => {
  e.preventDefault()
  e.stopPropagation()
  onSyncFromModel()
  onToggle(true)
}

// 手打時只放行數字與 format 用的分隔符
const onKeydownTimeMask = (e) => {
  const key = e.key
  const isCtrlCombo = e.ctrlKey || e.metaKey
  const isNavKey =
    key === 'Backspace' ||
    key === 'Delete' ||
    key === 'Tab' ||
    key === 'Enter' ||
    key === 'Escape' ||
    key.startsWith('Arrow') ||
    key === 'Home' ||
    key === 'End'

  if (isCtrlCombo || isNavKey) return
  if (/^\d$/.test(key)) return
  if (key === onParseTimeFormat(config.value.format).sep) return

  e.preventDefault()
}

const onSelect = (type, value) => {
  time.value = { ...time.value, [type]: value }

  const next = onFormatTime(time.value, config.value.format)
  emits('update:modelValue', next)

  if (editableCount.value <= 1) onToggle(false)

  nextTick(() => emits('selected'))
}

const onInput = (e) => {
  const parsed = onParseTime(e.target.value)
  if (parsed) time.value = parsed

  emits('input', e)
}

const onFocusin = (e) => {
  if (config.value.altInput) onToggle(true)
  else isFocus.value = true

  onSyncFromModel()
  emits('focusin', e)
}

// 手打到一半離開時,把值照 format 正規化寫回(09:5 → 09:05)
const onFocusout = (e) => {
  const parsed = onParseTime(model.value)

  if (parsed) {
    const next = onFormatTime(parsed, config.value.format)
    if (next !== model.value) model.value = next
  }

  if (!isActive.value) isFocus.value = false

  emits('focusout', e)
}

const onDocumentClick = (e) => onClickOutside(e, () => onToggle(false))

const onWindowResize = () => {
  onResize()
  onResizeDone(onOpen)()
}

watch(() => props.modelValue, onSyncFromModel, { immediate: true })

onResize()

onMounted(() => {
  onSyncFromModel()
  document.addEventListener('click', onDocumentClick, true)
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick, true)
  window.removeEventListener('resize', onWindowResize)
})
</script>

<template>
  <div class="m-datepicker --time" :class="setClass.main">
    <Field
      :name="props.name"
      :rules="props.rules"
      v-model="timeModel"
      v-bind="validateOn"
      v-slot="{ errorMessage }"
    >
      <div class="m-datepicker-container" ref="containerRef">
        <div
          class="m-datepicker-element"
          :class="[
            setClass.label,
            { '--required': model },
            { '--focus': isFocus },
            { '--error': errorMessage },
          ]"
        >
          <input
            class="m-datepicker-type"
            type="tel"
            :name="props.name"
            :minlength="config.length"
            :maxlength="config.length"
            :placeholder="config.placeholder"
            :readonly="!config.altInput"
            :value="timeModel"
            autocomplete="off"
            @pointerdown="onInputPointerdown($event)"
            @keydown="onKeydownTimeMask($event)"
            @focusin="onFocusin($event)"
            @click="onInputClick()"
            @focusout="onFocusout($event)"
            @input="onInput($event)"
            @keydown.enter="emits('keydown.enter')"
          />
          <div class="m-datepicker-ctrl">
            <!-- ⚠️ _svg 裡沒有時鐘圖示,所以預設沿用日曆的;要換就傳 config.icon -->
            <button
              type="button"
              class="m-datepicker-icon"
              @pointerdown="onIconPointerdown($event)"
              ref="iconRef"
            >
              <CommonSvgIcon :icon="config.icon" class="h-full w-full" />
            </button>
          </div>
        </div>
      </div>
    </Field>

    <ErrorMessage
      as="span"
      class="m-datepicker-error"
      :class="setClass.error"
      :name="props.name"
      v-slot="{ message }"
      v-if="(config.altInput && !isActive) || !config.altInput"
    >
      <BuyMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>

  <Teleport to="body">
    <Transition :name="isPopup ? 'datepicker-overlay' : 'datepicker'" appear @enter="onOpen">
      <div
        class="m-datepicker-calendar"
        :class="{ '--popup': isPopup }"
        ref="panelRef"
        v-if="isActive"
        @click.self="isPopup ? onToggle(false) : null"
      >
        <Transition name="datepicker-bomb" appear>
          <div class="m-datepicker-calendar-container" v-if="isActive">
            <BuyMDatepickerTimePanel
              :format="config.format"
              :value="time"
              :step="config.step"
              :minTime="config.minTime"
              :maxTime="config.maxTime"
              @select="onSelect"
            />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style src="@css/_modules/buy/mDatepicker.css"></style>
