/* mDatepicker 的預設設定。Single(日期)與 Time(時間)各一份,
  合併方式對齊 mForm 的 defaultDropdownConfig / onMergeDropdownConfig。

  注意：這些鍵是對外契約 —— 呼叫端(pages)傳進來的 config 就是照這份,不要改名。 */

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
  /* 手機要不要用這支自己畫的日曆。false 則整個交給原生的 <input type="date">,
    面板完全不出場 —— 那與「彈窗或浮層」是不同層次的選擇,
    要哪一種面板由 position 決定。 */
  mobileSupport: true,
  maximumYear: 0, // 年份清單可往後多顯示幾年
  days: 42, // 42 或 'auto';auto 會依當月週數決定列數
  lang: 'ch',
  /* auto | popup | 上下左右組合(如 'left-top')。
    也可以依裝置各給一種:{ m: 'popup' } 只有手機用置中彈窗,其餘是浮層;
    範圍型的前綴也認得({ tm: 'popup' } 是平板與手機)。 */
  position: 'auto',
  format: 'YYYY-MM-DD', // 字串,或 { model, datePicker } 分開指定
  /* 日曆標題列的年月怎麼操作:
      'string'  純文字,換月只能按左右箭頭
      'select'  年月各一個下拉,選完日曆留在原地
      'panel'   點年月把整片日曆換成年 / 月清單,選完才回到日曆 */
  headerMode: 'string',
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
  /* 整個選擇器唯讀 —— 點不開、也改不了值。

    表單控制項普遍需要這個狀態(送出中、沒有權限改、依別的欄位決定),
    而表單那幾支都有這一項。少了它的話,唯讀只剩下在外面蓋一層擋住點擊,
    而那一層擋不住鍵盤。

    打開時:輸入框與那顆日曆鈕都掛上 disabled(擋住點擊與鍵盤)、
    驗證規則也一起停掉(鎖住的欄位不該因為沒填而擋下整張表單),
    外層再掛一個 `--disabled` 的標記。

    外觀走 `--datepicker-disabled-*` 那一組變數(與表單那幾支用同一支灰 ——
    同一張表單裡兩種控制項不該是兩種灰)。樣式那一層歸接手的專案,
    要換成別的樣子就改那幾個變數,不必動這一支。 */
  isDisabled: false,
  /* 這個欄位要不要顯示成錯誤 —— **由外面告訴它**。

    驗證掛在包住整組的那支元件上時(跨欄位的判斷:選了某個選項才要填日期),
    這一欄自己沒有驗證,紅框只能由外面傳進來。
    少了這一項的話,照規範那樣寫的那一組裡,日期欄的紅框不會亮,
    **而且不報錯** —— 傳一個元件不認得的設定項就是靜靜地沒有作用。
    同一組裡的單選會亮、日期欄不會,看起來像是日期欄的驗證壞了。 */
  isError: false,
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
  // 語意與日期那一份的同名鍵完全一致 —— 時間欄位並排在日期旁邊,兩邊要同進同退
  isDisabled: false,
  isError: false,
}

/* 注意：format 要在合併「之後」再正規化一次 —— 呼叫端只給 { model: 'YYYYMMDD' } 時,
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
