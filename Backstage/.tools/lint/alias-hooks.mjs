/* 讓 node 直接載入用了路徑別名的產品程式碼。
 *
 * `@js/_prototype.js` 那種寫法是**建置工具的設定**(vite 的 resolve.alias、
 * nuxt 的 alias),建置時才會被換成真實路徑。node 自己跑的時候不讀那份設定,
 * 看到 `@js/` 就當成套件名去 node_modules 找,找不到就整支載不起來 ——
 * 於是那些檔案沒有辦法拿真的程式碼來驗行為。
 *
 * 這支把別名接回真實路徑,對照表由呼叫端從建置設定讀出來傳進來(見 aliasListOf),
 * 不寫死:別名叫什麼、指到哪一層,每個專案都不一樣。
 *
 * 用法(要在動態 import 之前註冊,靜態 import 在那之前就解析完了):
 *
 *   register('./alias-hooks.mjs', import.meta.url, { data: aliasListOf(root) })
 *
 * 這支只在驗證的時候用,產品程式碼不經過它。
 */
import path from 'node:path'
import { pathToFileURL } from 'node:url'

let aliases = []

export const initialize = (data) => {
  aliases = Array.isArray(data) ? data : []

  /* 「這個 package.json 沒有寫 type: module」那則提示要在**這裡**擋。
     模組是這支 hook 所在的執行緒解析的,提示也由這裡發出 ——
     呼叫端在自己那一邊裝的過濾器攔不到它,結果訊息照樣被那三行擠掉。 */
  const defaults = process.listeners('warning')

  process.removeAllListeners('warning')
  process.on('warning', (warning) => {
    if (warning.code === 'MODULE_TYPELESS_PACKAGE_JSON') return

    for (const listener of defaults) listener(warning)
  })
}

export const resolve = (specifier, context, next) => {
  for (const { alias, root } of aliases) {
    /* 整段相等,或是後面接了斜線才算命中 —— 只比開頭的話,
       `@jsonUtil` 會被 `@js` 吃掉,接出來的路徑指向不存在的位置。 */
    if (specifier !== alias && !specifier.startsWith(`${alias}/`)) continue

    const rest = specifier.slice(alias.length).replace(/^\//, '')

    return next(pathToFileURL(rest ? path.join(root, rest) : root).href, context)
  }

  return next(specifier, context)
}
