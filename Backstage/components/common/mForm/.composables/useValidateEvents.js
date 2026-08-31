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

// token → Field 的對應 prop。要開放新的驗證時機,在這裡加一組即可。
export const VALIDATE_EVENT_PROPS = {
  blur: 'validateOnBlur',
  change: 'validateOnChange',
  input: 'validateOnInput',
  modelUpdate: 'validateOnModelUpdate',
  mount: 'validateOnMount',
}

// source 可以是陣列、ref,或 getter(() => config.value.validateEvents)。
// ⚠️ 用 toValue 而非 unref —— unref 不會呼叫 getter,會把函式本身當成值傳下去,
//    於是 Array.isArray 判否、一律回傳「不覆寫」,設定就靜默失效了。
export default function useValidateEvents(source) {
  return computed(() => {
    const events = toValue(source)

    // 沒指定就整組不傳:Field 這幾個 prop 的預設是 undefined,代表沿用全域設定。
    // 傳 null 會被它的 Boolean 型別檢查警告,所以是「不給」而不是「給 null」。
    if (!Array.isArray(events)) return {}

    if (import.meta.dev) {
      const unknown = events.filter((event) => !(event in VALIDATE_EVENT_PROPS))

      // 字串 token 沒有型別保護,打錯只會靜默失效 —— 那是最難查的一種
      if (unknown.length) {
        console.warn(
          `[mForm] validateEvents 有無法辨識的項目:${unknown.join(', ')}。` +
            `可用值:${Object.keys(VALIDATE_EVENT_PROPS).join(' / ')}`
        )
      }
    }

    return Object.fromEntries(
      Object.entries(VALIDATE_EVENT_PROPS).map(([event, prop]) => [prop, events.includes(event)])
    )
  })
}
