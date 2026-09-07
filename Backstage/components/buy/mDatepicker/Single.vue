<script setup>
import '@css/_modules/buy/mDatepicker/variables.css'
import '@css/_modules/buy/mDatepicker/common.css'

/* 單一日期選擇。自己實作,不依賴第三方套件。

  這支只負責「輸入框 + 什麼時候展開」;日期怎麼算在 .composables,
  日曆長什麼樣在 Calendar.vue,年月切換的兩種模式各自一支元件。

  config 的鍵見 .composables/useConfig.js —— 那份是對外契約,不要改名。 */

import useValidateEvents from '../../common/mForm/.composables/useValidateEvents.js'
import {
  onGetYMDByFormat,
  onPickFormat,
  onGetFormatSep,
  onHasTimeFormat,
  onSplitDateTimeFormat,
} from './.composables/useDateCore.js'
import { onMergeDateConfig } from './.composables/useConfig.js'
import { useCalendar } from './.composables/useCalendar.js'
import { usePosition } from './.composables/usePosition.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

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

const inputType = computed(() => (isDeviceM.value && !config.value.mobileSupport ? 'date' : 'tel'))

/* format 帶時間段時,時間是**獨立的一個欄位**(Time.vue)並排在日期旁邊 ——
  不是把時間滾輪塞進日曆浮層。有哪幾欄仍然由 format 決定,轉手給那支元件判斷。 */
const hasTime = computed(() => onHasTimeFormat(onPickFormat(config.value.format, 'datePicker')))

const timeFormat = computed(
  () => onSplitDateTimeFormat(onPickFormat(config.value.format, 'datePicker')).time
)

/* model 是「日期 時間」兩半用一個空白接起來的字串。
  兩個欄位各自只認自己那半,寫回時再把另一半接上 —— 這樣時間欄位不必知道日期怎麼格式化,
  反之亦然。 */
const modelParts = computed(() => {
  const [date, time] = String(props.modelValue ?? '')
    .trim()
    .split(/\s+/)

  return { date: date || '', time: time || '' }
})

const model = computed({
  get: () => props.modelValue,
  set: (value) => emits('update:modelValue', value),
})

// 日期那半 —— 寫回時保留現有的時間
const dateModel = computed({
  get: () => modelParts.value.date,
  set: (value) => {
    const { time } = modelParts.value

    emits('update:modelValue', hasTime.value && time ? `${value} ${time}` : value)
  },
})

// 時間那半 —— 寫回時保留現有的日期
const timeModel = computed({
  get: () => modelParts.value.time,
  set: (value) => {
    const { date } = modelParts.value

    emits('update:modelValue', date ? `${date} ${value}` : value)
  },
})

// 日曆只吃日期那半 —— 時間交給 Time.vue,useCalendar 不碰
const calendar = useCalendar(config, dateModel)

const {
  containerRef,
  iconRef,
  panelRef,
  isDeviceM,
  isPopup,
  isActive,
  isFocus,
  onToggle,
  onOpen,
  onClickTimeField,
} = usePosition(config)

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
    const ymd = calendar.onGetYMDByConfig(dateModel.value, 'model')
    if (ymd) return calendar.onFormatBy(ymd.y, ymd.m, ymd.d, 'datePicker')

    if (!dateModel.value) return config.value.defaultIsToday ? calendar.today.value : ''

    return onGetInputValue(dateModel.value)
  },
  set(newValue) {
    const value = onGetInputValue(newValue)
    const ymd = onGetYMDByFormat(value, onPickFormat(config.value.format, 'datePicker'))

    dateModel.value = ymd ? calendar.onFormatBy(ymd.y, ymd.m, ymd.d, 'model') : value
  },
})

const setClass = computed(() => ({
  main: '',
  // format 帶時間段時,傳給並排的那個時間欄位
  time: '',
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

/* 選定的統一出口:收合 → 回報值 → 下一輪再發 selected。
  ⚠️ 走 dateModel 而不是直接 emit —— 它的 setter 會把現有的時間接回去,
      直接 emit 會把時間那半整個蓋掉。 */
const onCommit = (value) => {
  if (!value) return

  onToggle(false)
  dateModel.value = value

  nextTick(() => emits('selected'))
}

const onSelect = (dateStr) => onCommit(calendar.onSelectDate(dateStr))

const onSelectYMD = ({ y, m, d }) => onCommit(calendar.onSelectYMD(y, m, d))

watch(() => props.modelValue, calendar.onSyncFromModel, { immediate: true })

onMounted(() => {
  calendar.onSyncFromModel()
})
</script>

<template>
  <div class="m-datepicker --single" :class="setClass.main">
    <!-- 日期與時間並排。沒有時間段時 group 裡只有日期那一個,版型不受影響 -->
    <!-- @pointerdown.capture 綁在這一層而不是 Time 元件上 —— Time 是 fragment
           元件(div + Teleport 兩個根),Vue 的 attrs fallthrough 對多根元素失效,
           綁在它身上不會有落點;判斷本身在 usePosition,那裡有完整說明 -->
    <div class="m-datepicker-datetime-group" @pointerdown.capture="onClickTimeField">
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

      <!-- format 帶時間段時才出現。有哪幾欄由那支元件依 format 自己判斷 -->
      <BuyMDatepickerTime
        :name="`${props.name}Time`"
        v-model="timeModel"
        :config="{
          format: timeFormat,
          step: config.step,
          minTime: config.minTime,
          maxTime: config.maxTime,
          mobileSupport: config.mobileSupport,
          position: config.position,
        }"
        :setClass="{
          main: setClass.time,
        }"
        v-if="hasTime"
      />
    </div>

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
            @selectYMD="onSelectYMD"
            v-if="isActive"
          />
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
