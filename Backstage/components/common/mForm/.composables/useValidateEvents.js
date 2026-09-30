// 把 config.validateEvents(字串陣列)轉成 vee-validate <Field> 的 validateOn* props。
//
// 各 mForm 元件的 config 都接受:
//
//   validateEvents: null              不覆寫,沿用 vee-validate 全域預設
//                                     (等同 ['blur', 'change', 'modelUpdate'])
//   validateEvents: ['blur']          完整指定:只在離開欄位時驗
//   validateEvents: []                自動驗證全關,只剩 submit 時的主動 validate()
//
// 注意:傳陣列是「完整指定」而非在預設值上疊加 —— 沒列到的一律關閉。
//    想保留原本行為只拿掉一項,要把其餘項目寫出來,例如清空值不想跳紅字就用
//    ['blur', 'change'](把 modelUpdate 拿掉)。

import { FormContextKey } from 'vee-validate'

// token → Field 的對應 prop。要開放新的驗證時機,在這裡加一組即可。
export const VALIDATE_EVENT_PROPS = {
  blur: 'validateOnBlur',
  change: 'validateOnChange',
  input: 'validateOnInput',
  modelUpdate: 'validateOnModelUpdate',
  mount: 'validateOnMount',
}

/* 「碰過才即時驗」—— 本專案各元件的預設時機,不在上面那張表裡,因為它不是
  固定的開關而是**跟著欄位狀態變動**的:touched 之後才等同 modelUpdate。

  ## 為什麼需要它

  vee-validate 原生預設含 validateOnModelUpdate,也就是「值一動就驗」。那對
  「使用者正在填」的欄位是錯的時機:

    - 多欄位合成的 computed(姓+名、縣市+區域+地址)填到一半就跳紅字
    - 換縣市時程式自己把區域清空,紅字立刻出現
    - radio 切換讓一組欄位顯示出來,那些欄位還沒被碰過就先跳紅字

  ## 什麼時候開始即時驗

  三個時機都由 vee-validate 自己維護,這裡只是讀它,**使用端不必做任何事**:

    碰過(touched)     `v-bind="field"` 綁的 handleBlur 會設。
                      綁在隱藏欄位上的那幾支元件沒有 blur,它們自己在
                      使用者操作之後標記(見 useDropdownCore 的 onMarkTouched)
    送出              送出流程進來的第一件事就是把所有欄位標成碰過
                      (vee-validate 的 submissionHandler,`// Touch all fields`)
    驗過(validated)   只要有人呼叫過表單的 validate(),所有欄位都會標成驗過

  **兩個旗標都要看,不能只看碰過。** 送出的路徑不只一條:
  走 `<Form @submit>` 或 slot 的 handleSubmit 會經過那個 submissionHandler,
  而自己拿 slot 的 `validate()` 來驗的不經過它 —— 那條路只設驗過,不設碰過。
  只看碰過的話,用後面那種寫法的頁面完全不會即時驗,
  而使用端沒有任何線索:設定看起來是開的,紅字就是不更新。

  所以行為是:送出(或驗過)之前,碰過的欄位才即時驗;之後全部即時驗
  —— 補填完紅字馬上消失。

  ## 為什麼不是把它換算成 validateOnModelUpdate

  那是最直覺的寫法,而且**它不會動**:<Field> 的 validateOnModelUpdate 只在
  元件建立的那一刻被讀一次(vee-validate 把它解構成一個普通變數,
  之後每次值變動讀的都是那個定值)。而元件建立的當下誰都還沒碰過,
  傳進去的必然是 false 並被記住 —— 之後 touched 變成 true,那一側不會知道。

  這種失效沒有任何徵兆:設定看起來有生效,紅字就是不會即時更新。

  所以改成這一支自己盯著值:碰過了、而且值變了,就請表單驗這一欄。
  走的是表單的 validateField,不經過那個 prop。

  ## 為什麼要讀 form 而不是自己記一個 ref

  meta.touched 在 <Field> 的 **slot 裡**,拿自己的 slot 狀態回頭決定自己的
  props 會循環。從 form context 依名稱查不經過那個 slot,所以沒有這個問題。 */
export const TOUCHED_MODEL_UPDATE = 'touchedModelUpdate'

const KNOWN_EVENTS = new Set([...Object.keys(VALIDATE_EVENT_PROPS), TOUCHED_MODEL_UPDATE])

// source 可以是陣列、ref,或 getter(() => config.value.validateEvents)。
// 注意:用 toValue 而非 unref —— unref 不會呼叫 getter,會把函式本身當成值傳下去,
//    於是 Array.isArray 判否、一律回傳「不覆寫」,設定就靜默失效了。
//
// fieldName 是這個元件註冊給 vee-validate 的名稱,只有 touchedModelUpdate 會用到。
// 同一個元件有多個 Field 時傳陣列(mDatepicker 的區間就是起訖各一個),
// 語意是「任一個被碰過就算」—— 起訖本來就是一組,分開判斷反而奇怪。
export default function useValidateEvents(source, fieldName) {
  /* 元件不在 <Form> 底下時 form 是 null —— 那時 touchedModelUpdate 一律不成立
    (沒有表單也就沒有送出,只剩 blur / change 會驗)。 */
  const form = inject(FormContextKey, null)

  const fieldNames = computed(() => {
    const names = toValue(fieldName)

    return (Array.isArray(names) ? names : [names]).filter(Boolean)
  })

  /* 這個欄位開始即時驗了沒有 —— 碰過或驗過都算,理由見上面那段說明。

    getPathState 查不到(欄位還沒註冊)時回 undefined,那兩件都還沒發生。 */
  const isActive = computed(() => {
    if (!form) return false

    return fieldNames.value.some((name) => {
      const state = form.getPathState?.(name)

      return !!(state?.touched || state?.validated)
    })
  })

  /* 「碰過(或驗過)之後值一動就驗」由這裡執行 —— 理由見上面那段說明。

    只在有寫 touchedModelUpdate、而且沒有另外寫 modelUpdate 的時候才動:
    寫了 modelUpdate 的話 <Field> 自己就會驗,這裡再驗一次是重複的工。

    deep 是為了值本身是陣列或物件的欄位(一組 checkbox、日期區間)——
    少了它,那幾種欄位改內容不算變動,補選一項紅字不會消失,
    而畫面上看起來就是「選了沒有用」。 */
  watch(
    () => fieldNames.value.map((name) => form?.getPathState?.(name)?.value),
    () => {
      if (!form || !isActive.value) return

      const events = toValue(source)

      if (!Array.isArray(events)) return
      if (!events.includes(TOUCHED_MODEL_UPDATE) || events.includes('modelUpdate')) return

      fieldNames.value.forEach((name) => form.validateField?.(name))
    },
    { deep: true }
  )

  return computed(() => {
    const events = toValue(source)

    // 沒指定就整組不傳:Field 這幾個 prop 的預設是 undefined,代表沿用全域設定。
    // 傳 null 會被它的 Boolean 型別檢查警告,所以是「不給」而不是「給 null」。
    if (!Array.isArray(events)) return {}

    /* 開發時才提醒。判斷用 import.meta.env.DEV ——
       有框架的那一份另外提供了 import.meta.dev,但純建置工具那邊沒有這個屬性:
       寫成那一種的話,條件永遠是 undefined,整段提醒從來不會出現,
       而程式碼還留在產物裡。env.DEV 兩邊都成立。 */
    if (import.meta.env.DEV) {
      const unknown = events.filter((event) => !KNOWN_EVENTS.has(event))

      // 字串 token 沒有型別保護,打錯只會靜默失效 —— 那是最難查的一種
      if (unknown.length) {
        console.warn(
          `[mForm] validateEvents 有無法辨識的項目:${unknown.join(', ')}。` +
            `可用值:${[...KNOWN_EVENTS].join(' / ')}`
        )
      }

      if (events.includes(TOUCHED_MODEL_UPDATE) && !toValue(fieldName)) {
        console.warn(
          `[mForm] validateEvents 用了 ${TOUCHED_MODEL_UPDATE} 但沒有傳 fieldName,` +
            `無法判斷欄位碰過沒有 —— 會一直當成「還沒碰過」。`
        )
      }
    }

    const props = Object.fromEntries(
      Object.entries(VALIDATE_EVENT_PROPS).map(([event, prop]) => [prop, events.includes(event)])
    )

    /* touchedModelUpdate 不換算成任何一個 prop —— 它由上面那個 watch 執行。

      換算過去的話這條設定等於沒開:那個 prop 只在元件建立的當下被讀一次,
      而那一刻誰都還沒碰過。 */
    return props
  })
}
