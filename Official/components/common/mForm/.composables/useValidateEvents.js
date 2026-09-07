// 把 config.validateEvents(字串陣列)轉成 vee-validate <Field> 的 validateOn* props。
//
// 各 mForm 元件的 config 都接受:
//
//   validateEvents: null              不覆寫,沿用 vee-validate 全域預設
//                                     (等同 ['blur', 'change', 'modelUpdate'])
//   validateEvents: ['blur']          完整指定:只在離開欄位時驗
//   validateEvents: []                自動驗證全關,只剩 submit 時的主動 validate()
//
// ⚠️ 傳陣列是「完整指定」而非在預設值上疊加 —— 沒列到的一律關閉。
//    想保留原本行為只拿掉一項,要把其餘項目寫出來,例如清空值不想跳紅字就用
//    ['blur', 'change'](把 modelUpdate 拿掉)。

import { computed, inject, toValue } from 'vue'
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

  ## 什麼時候變成 touched

  兩個時機都由 vee-validate 自己維護,這裡只是讀它:

    blur         `v-bind="field"` 綁的 handleBlur 會設 touched(原始碼裡只有它設)
    送出         Form 的 slot 提供 setTouched(true),把所有欄位一起標記
                 ⚠️ 頁面的送出流程要呼叫它,漏了就退回「只有 blur 會開」

  所以行為是:送出前碰過的欄位才即時驗;送出後全部即時驗(補填完紅字馬上消失)。

  ## 為什麼要讀 form 而不是自己記一個 ref

  validateOn* 是 <Field> 的 **props**,而 meta.touched 在它的 **slot 裡** ——
  拿自己的 slot 狀態回頭決定自己的 props 會循環。從 form context 依名稱查
  不經過那個 slot,所以沒有這個問題。 */
export const TOUCHED_MODEL_UPDATE = 'touchedModelUpdate'

const KNOWN_EVENTS = new Set([...Object.keys(VALIDATE_EVENT_PROPS), TOUCHED_MODEL_UPDATE])

// source 可以是陣列、ref,或 getter(() => config.value.validateEvents)。
// ⚠️ 用 toValue 而非 unref —— unref 不會呼叫 getter,會把函式本身當成值傳下去,
//    於是 Array.isArray 判否、一律回傳「不覆寫」,設定就靜默失效了。
//
// fieldName 是這個元件註冊給 vee-validate 的名稱,只有 touchedModelUpdate 會用到。
// 同一個元件有多個 Field 時傳陣列(mDatepicker 的區間就是起訖各一個),
// 語意是「任一個被碰過就算」—— 起訖本來就是一組,分開判斷反而奇怪。
export default function useValidateEvents(source, fieldName) {
  /* 元件不在 <Form> 底下時 form 是 null —— 那時 touchedModelUpdate 一律不成立
    (沒有表單也就沒有送出,只剩 blur / change 會驗)。 */
  const form = inject(FormContextKey, null)

  const isTouched = computed(() => {
    if (!form) return false

    const names = toValue(fieldName)
    const list = Array.isArray(names) ? names : [names]

    // getPathState 查不到(欄位還沒註冊)時回 undefined,那就還沒被碰過
    return list.some((name) => !!(name && form.getPathState?.(name)?.touched))
  })

  return computed(() => {
    const events = toValue(source)

    // 沒指定就整組不傳:Field 這幾個 prop 的預設是 undefined,代表沿用全域設定。
    // 傳 null 會被它的 Boolean 型別檢查警告,所以是「不給」而不是「給 null」。
    if (!Array.isArray(events)) return {}

    if (import.meta.dev) {
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

    // 與 modelUpdate 是 or 的關係:兩個都寫時以「一律即時驗」為準
    if (events.includes(TOUCHED_MODEL_UPDATE)) {
      props.validateOnModelUpdate = props.validateOnModelUpdate || isTouched.value
    }

    return props
  })
}
