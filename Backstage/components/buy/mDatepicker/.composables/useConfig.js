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
  showOverDate: true, // 是否顯示超出 min/max 的日期
  defaultIsToday: true,
  today: null, // 指定「今天」(通常餵 server 時間)
  maxDate: '',
  minDate: '',
  length: null,
  placeholder: null,
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
  // ⚠️ _svg 裡目前沒有時鐘圖示,先沿用日曆的;要換就自己加一支 svg 再傳這個
  icon: 'icon_calendar',
  length: null,
  placeholder: null,
}

/* ⚠️ format 要在合併「之後」再正規化一次 —— 呼叫端只給 { model: 'YYYYMMDD' } 時,
    正規化會把 datePicker 補上,漏做的話輸入框那邊會拿到 undefined。 */
export const onMergeDateConfig = (config = {}) => {
  const merged = { ...defaultDateConfig, ...config }

  return { ...merged, format: onNormalizeFormat(merged.format) }
}

export const onMergeTimeConfig = (config = {}) => {
  const merged = { ...defaultTimeConfig, ...config }

  return { ...merged, step: { ...defaultTimeConfig.step, ...(config.step || {}) } }
}
