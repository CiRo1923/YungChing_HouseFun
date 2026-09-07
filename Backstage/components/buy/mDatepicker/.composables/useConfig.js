/* mDatepicker 的預設設定。Single(日期)與 Time(時間)各一份,
  合併方式對齊 mForm 的 defaultDropdownConfig / onMergeDropdownConfig。

  ⚠️ 這些鍵是對外契約 —— 呼叫端(pages)傳進來的 config 就是照這份,不要改名。 */

import { onNormalizeFormat } from './useDateCore.js'

export const weekLabels = {
  ch: [
    { key: 0, value: '日' },
    { key: 1, value: '一' },
    { key: 2, value: '二' },
    { key: 3, value: '三' },
    { key: 4, value: '四' },
    { key: 5, value: '五' },
    { key: 6, value: '六' },
  ],
  en: [
    { key: 0, value: 'Sun' },
    { key: 1, value: 'Mon' },
    { key: 2, value: 'Tue' },
    { key: 3, value: 'Wed' },
    { key: 4, value: 'Thu' },
    { key: 5, value: 'Fri' },
    { key: 6, value: 'Sat' },
  ],
}

export const monthLabels = {
  ch: [
    '一月',
    '二月',
    '三月',
    '四月',
    '五月',
    '六月',
    '七月',
    '八月',
    '九月',
    '十月',
    '十一月',
    '十二月',
  ],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

export const defaultDateConfig = {
  altInput: false, // true 才能手打,false 只能點日曆
  mobileSupport: true, // 手機改用置中的 popup;false 則交給原生 <input type="date">
  maximumYear: 0, // 年份清單可往後多顯示幾年
  days: 42, // 42 或 'auto';auto 會依當月週數決定列數
  lang: 'ch',
  position: 'auto', // auto | popup | 上下左右組合(如 'left-top')
  format: 'YYYY-MM-DD', // 字串,或 { model, datePicker } 分開指定
  headerMode: 'string', // 'string' 純文字 | 'panel' 點年月展開面板
  weeks: weekLabels,
  defaultIsToday: true,
  today: null, // 指定「今天」(通常餵 server 時間)
  maxDate: '',
  minDate: '',
  /* 以下三個只在 format 帶時間段時才用得到(YYYY-MM-DD hh:mm 這種)——
    語意與 defaultTimeConfig 的同名鍵完全一致,轉手傳給同一個時間面板。 */
  step: { hour: 1, minute: 1, second: 1 },
  minTime: '',
  maxTime: '',
  // Range 變體兩個欄位之間的符號
  rangeSeparator: '~',
  length: null,
  placeholder: null,
  // 驗證時機。blur / change 一律驗;值一動就驗只在「碰過之後」才生效
  // (touchedModelUpdate 的用意見 components/common/mForm/.composables/useValidateEvents.js)。
  // 傳陣列為「完整指定」,沒列到的一律關閉。
  validateEvents: ['blur', 'change', 'touchedModelUpdate'],
}

export const defaultTimeConfig = {
  altInput: false,
  mobileSupport: true,
  position: 'auto',
  /* 欄位有哪些、能不能選,全看這個 —— 見 useTimeCore.js:
      hh:mm:ss / hh:mm / hh / hh:00:00 / hh:mm:00 */
  format: 'hh:mm:ss',
  step: { hour: 1, minute: 1, second: 1 },
  defaultIsNow: false, // 對齊日期的 defaultIsToday
  minTime: '',
  maxTime: '',
  icon: 'icon_time',
  length: null,
  placeholder: null,
  // 驗證時機。blur / change 一律驗;值一動就驗只在「碰過之後」才生效
  // (touchedModelUpdate 的用意見 components/common/mForm/.composables/useValidateEvents.js)。
  // 傳陣列為「完整指定」,沒列到的一律關閉。
  validateEvents: ['blur', 'change', 'touchedModelUpdate'],
}

/* ⚠️ format 要在合併「之後」再正規化一次 —— 呼叫端只給 { model: 'YYYYMMDD' } 時,
    正規化會把 datePicker 補上,漏做的話輸入框那邊會拿到 undefined。 */
export const onMergeDateConfig = (config = {}) => {
  const merged = { ...defaultDateConfig, ...config }

  return {
    ...merged,
    format: onNormalizeFormat(merged.format),
    // step 與時間那支一樣要逐欄合併,呼叫端只給 { minute: 15 } 時另兩欄才不會掉
    step: { ...defaultDateConfig.step, ...(config.step || {}) },
  }
}

export const onMergeTimeConfig = (config = {}) => {
  const merged = { ...defaultTimeConfig, ...config }

  return {
    ...merged,
    step: { ...defaultTimeConfig.step, ...(config.step || {}) },
    /* placeholder 沒給就用 format 本身當提示(hh:mm:ss / hh:mm / hh …)。
      不寫死成 hh:mm:ss —— format 只到分的時候,提示三段會對不上實際能填的欄位。 */
    placeholder: merged.placeholder ?? merged.format,
  }
}
