<script setup>
import '@css/_modules/buy/mDatepicker/variables.css'
import '@css/_modules/buy/mDatepicker/common.css'

/* 單一日期選擇。自己實作,不依賴第三方套件。

  這支只負責「輸入框 + 什麼時候展開」;日期怎麼算在 .composables,
  日曆長什麼樣在 Calendar.vue,年月切換的兩種模式各自一支元件。

  config 的鍵見 .composables/useConfig.js —— 那份是對外契約,不要改名。 */

import useValidateEvents from '../../common/mForm/.composables/useValidateEvents.js'
import { onGetYMDByFormat, onPickFormat, onGetFormatSep } from './.composables/useDateCore.js'
import { onMergeDateConfig } from './.composables/useConfig.js'
import { useCalendar } from './.composables/useCalendar.js'
import { usePosition } from './.composables/usePosition.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

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

const config = computed(() => onMergeDateConfig(props.config))
const validateOn = useValidateEvents(() => config.value.validateEvents)

const containerRef = ref(null)
const iconRef = ref(null)
const panelRef = ref(null)

const isFocus = ref(false)
const isActive = ref(false)
const isDeviceM = computed(() => device.value === 'm')

// 手機且開啟 mobileSupport → 置中的 popup;關掉則交給原生 <input type="date">
const isPopup = computed(() => isDeviceM.value && config.value.mobileSupport)
const inputType = computed(() => (isDeviceM.value && !config.value.mobileSupport ? 'date' : 'tel'))

const model = computed({
  get: () => props.modelValue,
  set: (value) => emits('update:modelValue', value),
})

const calendar = useCalendar(config, model)

const { onOpen, onClickOutside, onResizeDone } = usePosition(config, isPopup, {
  container: containerRef,
  icon: iconRef,
  panel: panelRef,
})

const onGetInputValue = (value) => {
  if (value?.target) return value.target.value
  if (value == null) return ''
  if (value instanceof Date) return value

  return typeof value === 'string' || typeof value === 'number' ? value : ''
}

/* 畫面上顯示的值。model 存的格式與輸入框顯示的格式可以不同
  (config.format 給 { model, datePicker } 時),所以中間要轉一手。 */
const datePickerModel = computed({
  get() {
    const ymd = calendar.onGetYMDByConfig(model.value, 'model')
    if (ymd) return calendar.onFormatBy(ymd.y, ymd.m, ymd.d, 'datePicker')

    if (model.value == null) return config.value.defaultIsToday ? calendar.today.value : ''

    return onGetInputValue(model.value)
  },
  set(newValue) {
    const value = onGetInputValue(newValue)
    const ymd = onGetYMDByFormat(value, onPickFormat(config.value.format, 'datePicker'))

    model.value = ymd ? calendar.onFormatBy(ymd.y, ymd.m, ymd.d, 'model') : value
  },
})

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

const onToggle = (value) => {
  isActive.value = value !== undefined ? value : !isActive.value
  isFocus.value = isActive.value
}

/* altInput = false 時輸入框不給打字,點它就是展開日曆,
  所以要 preventDefault 擋掉 focus,不然手機會跳出鍵盤。 */
const onInputPointerdown = (e) => {
  if (config.value.altInput) return

  e.preventDefault()
  e.stopPropagation()
  calendar.onSyncFromModel()
  onToggle(true)
}

const onInputClick = () => {
  if (!config.value.altInput || isActive.value) return

  onToggle(true)
  calendar.onSyncFromModel()
}

const onCalendarButtonPointerdown = (e) => {
  e.preventDefault()
  e.stopPropagation()
  calendar.onSyncFromModel()
  onToggle(true)
}

// 手打時只放行數字與目前 format 用的分隔符
const onKeydownDateMask = (e) => {
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
  if (key === onGetFormatSep(onPickFormat(config.value.format, 'datePicker'))) return

  e.preventDefault()
}

const onFocusin = (e) => {
  if (config.value.altInput) onToggle(true)
  else isFocus.value = true

  calendar.onSyncFromModel()
  emits('focusin', e)
}

// 手打到一半離開時,把補完的合法日期寫回 model
const onFocusout = (e) => {
  calendar.onSyncFromModel()

  if (calendar.formatDate.value && model.value !== calendar.formatDate.value) {
    model.value = calendar.formatDate.value
  }

  if (!isActive.value) isFocus.value = false

  emits('focusout', e)
}

const onSelect = (dateStr) => {
  const value = calendar.onSelectDate(dateStr)
  if (!value) return

  onToggle(false)
  emits('update:modelValue', value)

  nextTick(() => emits('selected'))
}

const onDocumentClick = (e) => onClickOutside(e, () => onToggle(false))

const onWindowResize = () => {
  onResize()
  onResizeDone(onOpen)()
}

watch(() => props.modelValue, calendar.onSyncFromModel, { immediate: true })

onResize()

onMounted(() => {
  calendar.onSyncFromModel()
  document.addEventListener('click', onDocumentClick, true)
  window.addEventListener('resize', onWindowResize)
})

/* ⚠️ 這裡一定要移除的是「同一個」函式參照 —— 原本傳的是匿名箭頭函式,
    removeEventListener 根本對不上,每掛載一次就多留一個 listener。 */
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick, true)
  window.removeEventListener('resize', onWindowResize)
})
</script>

<template>
  <div class="m-datepicker --single" :class="setClass.main">
    <Field
      :name="props.name"
      :rules="props.rules"
      v-model="datePickerModel"
      v-bind="validateOn"
      v-slot="{ field, errorMessage }"
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
            :type="inputType"
            v-bind="field"
            :minlength="config.length"
            :maxlength="config.length"
            :placeholder="config.placeholder"
            :readonly="!config.altInput"
            :value="datePickerModel"
            autocomplete="off"
            @pointerdown="onInputPointerdown($event)"
            @keydown="onKeydownDateMask($event)"
            @focusin="onFocusin($event)"
            @click="onInputClick()"
            @focusout="onFocusout($event)"
            @input="emits('input', $event)"
            @keydown.enter="emits('keydown.enter')"
          />
          <div class="m-datepicker-ctrl">
            <button
              type="button"
              class="m-datepicker-icon"
              @pointerdown="onCalendarButtonPointerdown($event)"
              ref="iconRef"
            >
              <CommonSvgIcon icon="icon_calendar" />
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
          <BuyMDatepickerCalendar
            :name="props.name"
            :config="config"
            :calendar="calendar"
            @select="onSelect"
            v-if="isActive"
          />
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
