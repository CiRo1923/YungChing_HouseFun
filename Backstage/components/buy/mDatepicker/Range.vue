<script setup>
import '@css/_modules/buy/mDatepicker/variables.css'
import '@css/_modules/buy/mDatepicker/common.css'

/* 區間日期選擇。起訖各一個輸入框,共用同一個日曆浮層。

  操作:點哪一個欄位就從那一端開始選 —— 點「起」選完會自動跳到「訖」,
  兩端都有值才收合並回報。第二次點到比起始日更早的日期會自動交換,
  不會出現訖早於起的狀態。

  v-model 是**兩個元素的陣列** [起, 訖],格式與 config.format 的 model 一致;
  還沒選完時不會回報,所以呼叫端拿到的一定是完整區間(或空)。

  日期怎麼算、格子怎麼標色都在 .composables/useCalendar.js ——
  區間的底色靠傳進去的 range,那支會依起訖給出 --range-start / --in-range / --range-end。

  config 的鍵見 .composables/useConfig.js —— 那份是對外契約,不要改名。 */

import useValidateEvents from '../../common/mForm/.composables/useValidateEvents.js'
import {
  onDateOnlyMs,
  onGetYMD,
  onHasTimeFormat,
  onPickFormat,
  onSplitDateTimeFormat,
} from './.composables/useDateCore.js'
import { onMergeDateConfig } from './.composables/useConfig.js'
import { useCalendar } from './.composables/useCalendar.js'
import { usePosition } from './.composables/usePosition.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'selected', 'focusin', 'focusout'])

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  // [起, 訖]
  modelValue: {
    type: Array,
    default: () => [],
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

// 現在在選哪一端
const activeField = ref('start')
/* 選取中的起訖(Date | null)。傳給 useCalendar 畫底色,兩端都有值才寫回 v-model ——
  中途的半套狀態不該讓呼叫端看到。 */
const draft = ref({ start: null, end: null })

const modelStart = computed(() => props.modelValue?.[0] ?? null)
const modelEnd = computed(() => props.modelValue?.[1] ?? null)

/* format 帶時間段時,起訖各自再多一個時間欄位 —— 畫面上總共四個框:
  [起日期][起時間] ~ [訖日期][訖時間]。日期由共用的日曆選,時間各自獨立。 */
const hasTime = computed(() => onHasTimeFormat(onPickFormat(config.value.format, 'datePicker')))

const timeFormat = computed(
  () => onSplitDateTimeFormat(onPickFormat(config.value.format, 'datePicker')).time
)

// 陣列的每一個元素都是「日期 時間」用一個空白接起來的字串
const onSplitValue = (value) => {
  const [date, time] = String(value ?? '')
    .trim()
    .split(/\s+/)

  return { date: date || '', time: time || '' }
}

const startParts = computed(() => onSplitValue(modelStart.value))
const endParts = computed(() => onSplitValue(modelEnd.value))

/* 四個欄位共用的寫回出口 —— 只覆蓋指定的那一半,其餘沿用現有的值。
  這樣改起時間不會動到訖、選日期也不會把時間洗掉。 */
const onEmitPair = (patch = {}) => {
  const onMerge = (parts, date, time) => ({
    date: date === undefined ? parts.date : date,
    time: time === undefined ? parts.time : time,
  })
  const onJoin = ({ date, time }) => (date && time ? `${date} ${time}` : date || '')

  const start = onMerge(startParts.value, patch.startDate, patch.startTime)
  const end = onMerge(endParts.value, patch.endDate, patch.endTime)

  emits('update:modelValue', [onJoin(start), onJoin(end)])
}

const startTimeModel = computed({
  get: () => startParts.value.time,
  set: (value) => onEmitPair({ startTime: value }),
})

const endTimeModel = computed({
  get: () => endParts.value.time,
  set: (value) => onEmitPair({ endTime: value }),
})

/* 日曆要停在哪一端的月份 —— 跟著正在選的那個欄位走,
  這樣點「訖」時日曆會直接停在訖的月份,不必自己翻回去。
  只吃日期那半:時間由各自的時間欄位管,useCalendar 不碰。 */
const activeModel = computed(() =>
  activeField.value === 'end' ? endParts.value.date : startParts.value.date
)

const calendar = useCalendar(config, activeModel, { range: draft })

const {
  containerRef,
  iconRef,
  panelRef,
  isPopup,
  isActive,
  isFocus,
  onToggle,
  onOpen,
  onClickTimeField,
} = usePosition(config)

// 畫面上顯示的值。model 與畫面格式可以不同,所以中間要轉一手
const onDisplay = (value) => {
  const ymd = calendar.onGetYMDByConfig(value, 'model')

  return ymd ? calendar.onFormatBy(ymd.y, ymd.m, ymd.d, 'datePicker') : ''
}

const displayStart = computed(() => onDisplay(startParts.value.date))
const displayEnd = computed(() => onDisplay(endParts.value.date))

const setClass = computed(() => ({
  main: '',
  group: '',
  start: '',
  end: '',
  // format 帶時間段時,傳給起訖各自的時間欄位
  startTime: '',
  endTime: '',
  separator: '',
  error: '',
  ...props.setClass,
}))

/* 點欄位就從那一端開始選。
  ⚠️ 這裡不清任何值 —— 清了 draft 卻沒清 model 的話,欄位還顯示舊日期、
      日曆卻沒有區間色,兩邊對不上。「舊的訖要不要作廢」在選到新的起始日時才判斷
      (見 onSelect:新的起始日晚於原本的訖才作廢)。 */
const onFieldPointerdown = (e, field) => {
  e.preventDefault()
  e.stopPropagation()

  activeField.value = field

  calendar.onSyncFromModel()
  onToggle(true)
}

const onFormatDate = (value) => {
  const ymd = onGetYMD(value)

  return ymd ? calendar.onFormatBy(ymd.y, ymd.m, ymd.d, 'model') : ''
}

/* 每選一次就寫回,不等整個區間選完 —— 點了起始日,那個值要立刻出現在起的欄位上。
  兩端都有值才收合。

  ⚠️ 走 onEmitPair 而不是直接 emit —— 它只覆蓋日期那半,
      兩個時間欄位已經填的值不會被日期的選取洗掉。 */
const onCommit = () => {
  const { start, end } = draft.value

  onEmitPair({ startDate: onFormatDate(start), endDate: onFormatDate(end) })

  if (!start || !end) return

  onToggle(false)

  nextTick(() => emits('selected'))
}

const onSelect = (dateStr) => {
  const ymd = onGetYMD(dateStr)
  if (!ymd) return

  const ms = onDateOnlyMs(ymd.date)

  if (activeField.value === 'start') {
    const endMs = onDateOnlyMs(draft.value.end)

    // 新的起始日晚於原本的訖 → 那個訖作廢,重新選
    draft.value = {
      start: ymd.date,
      end: endMs != null && ms > endMs ? null : draft.value.end,
    }

    // 選完起自動跳到訖,浮層留著 —— 使用者接著要選的就是訖
    activeField.value = 'end'
    onCommit()

    return
  }

  const startMs = onDateOnlyMs(draft.value.start)

  // 選到比起始日更早的日期 → 交換,而不是拒絕
  draft.value =
    startMs != null && ms < startMs
      ? { start: ymd.date, end: draft.value.start }
      : { ...draft.value, end: ymd.date }

  onCommit()
}

// 只到年 / 月的精度也要能選區間 —— 走的是同一條狀態機,只是日期由年月清單給
const onSelectYMD = ({ y, m, d }) => {
  const ymd = onGetYMD(calendar.onFormatBy(y, m, d, 'datePicker'))

  if (ymd) onSelect(ymd.date)
}

// 外部改了 v-model → 同步回選取中的狀態(deep:陣列內容變動也要收到)
watch(
  () => props.modelValue,
  (value) => {
    const [start, end] = Array.isArray(value) ? value : []

    draft.value = {
      start: start ? onGetYMD(start)?.date || null : null,
      end: end ? onGetYMD(end)?.date || null : null,
    }

    calendar.onSyncFromModel()
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  calendar.onSyncFromModel()
})
</script>

<template>
  <div class="m-datepicker --range" :class="setClass.main">
    <div class="m-datepicker-container" ref="containerRef">
      <div class="m-datepicker-range-group" :class="setClass.group">
        <!-- 起:日期 +(format 帶時間段時)時間 -->
        <!-- @pointerdown.capture 綁在這一層而不是 Time 元件上 —— Time 是 fragment
           元件(div + Teleport 兩個根),Vue 的 attrs fallthrough 對多根元素失效,
           綁在它身上不會有落點;判斷本身在 usePosition,那裡有完整說明 -->
        <div class="m-datepicker-datetime-group" @pointerdown.capture="onClickTimeField">
          <Field
            :name="`${props.name}Start`"
            :rules="props.rules"
            :modelValue="displayStart"
            v-bind="validateOn"
            v-slot="{ field, errorMessage }"
          >
            <div
              class="m-datepicker-element"
              :class="[
                setClass.start,
                { '--required': modelStart },
                { '--focus': isFocus && activeField === 'start' },
                { '--error': errorMessage },
              ]"
            >
              <input
                class="m-datepicker-type"
                type="tel"
                v-bind="field"
                :placeholder="config.placeholder"
                :value="displayStart"
                readonly
                autocomplete="off"
                @pointerdown="onFieldPointerdown($event, 'start')"
                @focusin="emits('focusin', $event)"
                @focusout="emits('focusout', $event)"
              />
              <div class="m-datepicker-ctrl">
                <!-- 浮層的定位基準綁在「起」這一顆 —— 兩顆都綁的話 ref 會變陣列 -->
                <button
                  type="button"
                  class="m-datepicker-icon"
                  @pointerdown="onFieldPointerdown($event, 'start')"
                  ref="iconRef"
                >
                  <CommonSvgIcon icon="icon_calendar" />
                </button>
              </div>
            </div>
          </Field>

          <BuyMDatepickerTime
            :name="`${props.name}StartTime`"
            v-model="startTimeModel"
            :config="{
              format: timeFormat,
              step: config.step,
              minTime: config.minTime,
              maxTime: config.maxTime,
              mobileSupport: config.mobileSupport,
              position: config.position,
            }"
            :setClass="{
              main: setClass.startTime,
            }"
            v-if="hasTime"
          />
        </div>

        <span class="m-datepicker-range-separator" :class="setClass.separator">
          {{ config.rangeSeparator }}
        </span>

        <!-- 訖:日期 +(format 帶時間段時)時間 -->
        <div class="m-datepicker-datetime-group" @pointerdown.capture="onClickTimeField">
          <Field
            :name="`${props.name}End`"
            :rules="props.rules"
            :modelValue="displayEnd"
            v-bind="validateOn"
            v-slot="{ field, errorMessage }"
          >
            <div
              class="m-datepicker-element"
              :class="[
                setClass.end,
                { '--required': modelEnd },
                { '--focus': isFocus && activeField === 'end' },
                { '--error': errorMessage },
              ]"
            >
              <input
                class="m-datepicker-type"
                type="tel"
                v-bind="field"
                :placeholder="config.placeholder"
                :value="displayEnd"
                readonly
                autocomplete="off"
                @pointerdown="onFieldPointerdown($event, 'end')"
                @focusin="emits('focusin', $event)"
                @focusout="emits('focusout', $event)"
              />
              <div class="m-datepicker-ctrl">
                <!-- 點訖的圖示就從訖開始選 —— 與點訖的輸入框一致 -->
                <button
                  type="button"
                  class="m-datepicker-icon"
                  @pointerdown="onFieldPointerdown($event, 'end')"
                >
                  <CommonSvgIcon icon="icon_calendar" />
                </button>
              </div>
            </div>
          </Field>

          <BuyMDatepickerTime
            :name="`${props.name}EndTime`"
            v-model="endTimeModel"
            :config="{
              format: timeFormat,
              step: config.step,
              minTime: config.minTime,
              maxTime: config.maxTime,
              mobileSupport: config.mobileSupport,
              position: config.position,
            }"
            :setClass="{
              main: setClass.endTime,
            }"
            v-if="hasTime"
          />
        </div>
      </div>
    </div>

    <ErrorMessage
      as="span"
      class="m-datepicker-error"
      :class="setClass.error"
      :name="`${props.name}Start`"
      v-slot="{ message }"
      v-if="!isActive"
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
