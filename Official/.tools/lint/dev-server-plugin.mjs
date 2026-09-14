// 開發伺服器的規範守門員 —— 存檔當下即時生效。
//
//   1. 存檔色票檔 → 依規則自動重新排序(只動順序,不動色值)
//   2. 存檔任何在檢查範圍內的檔案 → 自動修正該修的、規範檢查逐筆印在終端機
//
// **這支只做四件事:監看存檔、去抖、執行 guard-file.mjs、把輸出印出來。**
// 判斷、排序、訊息全部在那一支裡面 —— 這裡一行規則都不寫。
//
//    自己 import 引擎的內部函式去組一份「排序 + 檢查 + 印出」的話,
//    引擎調整介面時這支會在載入當下就失敗,而這一層平常沒有人盯著它有沒有活著:
//    要到有人主動測試才會發現,中間所有的存檔都沒有被檢查過。
//
// 這裡寫的是 Vite 的外掛形狀。**別的建置工具自己接,但那四件事一樣。**
// 放在規範工具自己的目錄底下,是因為框架各有保留的目錄名
// (Nuxt 的 `plugins/` 放的是應用程式的執行期 plugin,把建置外掛放進去會被當成那種載入)。
//
// 只在 dev(apply: 'serve')生效,build 不跑,也不會擋掉任何東西。

import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { SCANNABLE_RE } from './project-config.mjs'

/**
 * 一次存檔常常會觸發好幾個 watcher 事件 —— prettier 的 formatOnSave、eslint 的
 * fixAll 各自又寫一次檔,加上編輯器的原子替換(寫暫存檔再 rename)。
 * 不去抖的話同一份警告會連印三四次,把終端機洗掉。
 *
 * 兩道保險:
 *   1. 每個檔案 300ms 內的事件合併成一次
 *   2. 內容沒變就不重複報(hash 比對)
 *
 * 第 2 道有時效(ECHO_WINDOW_MS)—— 只用來擋「同一次存檔的回音」。
 *    沒有時效的話,按 Ctrl+S 但內容沒改動時會完全沒有反應,看起來就像守門員壞了;
 *    而「存檔後想確認有沒有過」正是最常見的用法。
 */
const DEBOUNCE_MS = 300
const ECHO_WINDOW_MS = 2000

const GUARD = '.tools/lint/guard-file.mjs'

export const cssGuard = () => {
  const timers = new Map()
  const lastSeen = new Map()

  let root = process.cwd()

  const onCheck = (file) => {
    if (!fs.existsSync(file)) return

    const hash = createHash('sha1').update(fs.readFileSync(file)).digest('hex')
    const seen = lastSeen.get(file)
    if (seen?.hash === hash && Date.now() - seen.at < ECHO_WINDOW_MS) return
    lastSeen.set(file, { hash, at: Date.now() })

    // 非同步執行,不要卡住 HMR;輸出直接接到終端機。
    // FORCE_COLOR:子行程的 stdout 是 pipe 不是 TTY,不強制的話輸出會是黑白的 ——
    // 但這些訊息最後是由這裡 console.log 轉印到 dev server 的終端機。
    execFile(
      process.execPath,
      [path.join(root, GUARD), file],
      { cwd: root, env: { ...process.env, FORCE_COLOR: '1' } },
      (_err, stdout, stderr) => {
        const out = `${stdout ?? ''}${stderr ?? ''}`.trimEnd()
        if (out) console.log(out)
      }
    )
  }

  return {
    name: 'css-guard',
    apply: 'serve',
    configResolved(config) {
      root = config.root ?? root
    },
    handleHotUpdate({ file }) {
      // 副檔名範圍定義在 .tools/lint/project-config.mjs,五層守門共用同一份
      if (!SCANNABLE_RE.test(file)) return

      clearTimeout(timers.get(file))
      timers.set(
        file,
        setTimeout(() => {
          timers.delete(file)
          onCheck(file)
        }, DEBOUNCE_MS)
      )
    },
  }
}

export default cssGuard
