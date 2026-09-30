/* 設定項只能填固定幾個值時,填了別的要當場講出來。

  **填錯不會報錯,而且多半看不出原因。** 元件拿那個值去比對,
  每一條分支都不成立 —— 於是那一段畫面什麼都不畫、或那個行為靜靜地不發生,
  而設定看起來是有填的。下拉的箭頭曾經就是這樣:那個設定只有一個值有實作,
  填另一個進來箭頭直接不見,從畫面上看不出是設定的問題。

  **宣告寫在元件自己那一支,判斷收在這裡一份。**
  各元件各寫一次的話,訊息的形狀會分岔(有的說得出可用值、有的只說錯了),
  而漏寫的那幾支從此沒有人守 —— 漏了也不會有徵兆。

  用法:

    useConfigOptions(config, {
      mode: ['group', 'single'],
      sort: [null, 'desc', 'asc'],
    })

  清單裡可以放 null —— 那代表「不指定」本身就是一個合法的值。 */

/**
 * @param config   元件算好的設定(computed 或物件都可以)
 * @param options  哪幾個設定項有限定值,各自的可用值有哪些
 */
export const useConfigOptions = (config, options) => {
  /* 只在開發時看。判斷用 import.meta.env.DEV —— 有框架的那一份另外提供了
     import.meta.dev,但純建置工具那邊沒有這個屬性:寫成那一種的話,
     條件永遠是 undefined,整段檢查從來不會執行,而程式碼還留在產物裡。 */
  if (!import.meta.env.DEV) return

  watchEffect(() => {
    const current = toValue(config) ?? {}

    for (const [key, allowed] of Object.entries(options)) {
      const value = current[key]

      if (allowed.includes(value)) continue

      /* 可用值裡的 null 印成 null 而不是空字串 —— 印成空的話,
         看的人會以為那一格漏寫了。 */
      const list = allowed.map((one) => (one === null ? 'null' : `'${one}'`)).join(' / ')

      console.warn(
        `[mForm] 設定 ${key} 填了 ${JSON.stringify(value)},那不是它認得的值。` +
          `可用值:${list}。填了別的不會報錯,但元件每一條分支都對不上 ——` +
          `那一段畫面不會出現,或那個行為不會發生。`
      )
    }
  })
}
