// 全站規範 —— 不限於 CSS,可檢查的每一種檔案都適用。
// 副檔名範圍由 project-config.mjs 的 SCANNABLE_EXTENSIONS 決定,這裡不另外列一份 ——
// 列了就會有跟它對不上的一天,而對不上的那種檔案會靜靜地不再被檢查。
//
// 這裡放的是「跟樣式無關、但每一種檔案都要守」的規則。
// CSS 專屬的規則在 lint-core.mjs,兩邊都吐同一種 issue 物件,由 lintFile 合併。

import {
  ABSOLUTE_PATH_SCOPE,
  PROJECT_NAME_PATTERNS,
  PROJECT_NAME_SCOPE,
  issueOf,
  lineNoOf,
} from './shared.mjs'

// --- 規則 projectName:不得寫死專案名稱、不得跨專案引用 -----------------------
//
// 為什麼:專案名稱寫進程式碼之後,這份檔案就只能待在這個專案。
// 共用組件複製到別的專案要逐行改;搬過去忘了改就變成錯的敘述(規範文件、
// 提示訊息尤其容易),而且從程式碼看不出哪些是「本專案限定」。
// 網域、路徑、識別字一律走環境變數或設定檔。
//
// 跨專案引用(跳出專案根的相對路徑、絕對路徑)更嚴重 ——
// 那條路徑只在某台開發機上成立:每個人的專案擺法不同,作業系統也不一定一樣
// (磁碟機代號 vs 家目錄),別人 clone 下來直接壞掉,build 也不會過。
//
// ⚠️ 這裡與訊息中都**不要寫出任何實際路徑當範例** —— 那本身就是寫死路徑,
//    而且會讓人以為只有那種形狀才算違規。
//
// 要抓哪幾種寫法定義在 project-config.mjs 的 PROJECT_NAME_PATTERNS ——
// 專案名稱是每個專案各不相同的東西,寫在規則裡的話,換一個專案之後
// 這條會去抓一個與它無關的字,而它自己的名稱反而不會被抓。
const PROJECT_NAME_RE = PROJECT_NAME_PATTERNS

/**
 * 這條規則**只管規範系統自身** —— 檢查工具、skills、hooks,
 * 以及規範自己的說明文件。那些會整批複製到下一個專案。
 *
 * 原始碼不在範圍內。頁面標題、頁尾品牌名、條款裡的品牌名稱是內容本身,
 * 不是被寫死的設定 —— 那些檔案不會複製到別的專案,寫出品牌名是正確的。
 * 一併納入的話,清單會被大量正當文案淹沒,真正該擋的那幾筆反而看不到。
 *
 * 範圍之內仍有例外:用來記錄實際服務位置的清單(網址對照表那類),
 * 裡面的網址是資料本身。這種檔案在檔頭標 `lint-project-name-exempt`
 * 並寫明理由,就會跳過整份。
 */
const PROJECT_NAME_EXEMPT_RE = /lint-project-name-exempt/

const checkProjectName = ({ rel, text }) => {
  if (!PROJECT_NAME_SCOPE.some((prefix) => rel.startsWith(prefix))) return []
  if (PROJECT_NAME_EXEMPT_RE.test(text)) return []

  const issues = []
  const seen = new Set()

  for (const re of PROJECT_NAME_RE) {
    for (const m of text.matchAll(new RegExp(re.source, `${re.flags.replace('g', '')}g`))) {
      if (seen.has(m[0].toLowerCase())) continue
      seen.add(m[0].toLowerCase())

      issues.push(
        issueOf(
          rel,
          lineNoOf(text, m.index),
          'projectName',
          `寫死了專案名稱「${m[0]}」 —— 網域 / 路徑 / 識別字走環境變數或設定檔,這支檔案才搬得到別的專案`
        )
      )
    }
  }

  return issues
}

// --- 規則 absolutePath:任何地方都不寫某一台機器上的路徑 ----------------------
//
// 界線:**所有路徑形狀的問題都歸這一條**,包含 import 裡的絕對路徑與跳出專案根
// 的相對路徑。上面那條 projectName 只管一件事 —— 有沒有寫死專案名稱。
// 分開之後,同一行不會同時報兩筆敘述不同的違規,豁免標記也只需要標一個。
//
// 不只 import —— 註解、說明文件、錯誤訊息、指令範例裡的絕對路徑同樣不行。
//
// 那種路徑只在寫的人那台電腦上成立:每個人的專案擺在不同位置,
// 作業系統也不一定一樣(磁碟機代號 vs 家目錄)。照著文件操作的人會找不到檔案,
// 而且看不出正確的位置該是哪裡。
//
// 一律改寫成「相對專案根目錄的路徑」,例如 src/… 或 .tools/…。
//
// ⚠️ 這條會抓到「為了定義規則而必須寫出路徑形狀」的檔案(規則本身、測試案例)。
//    那種檔案在檔頭標 lint-absolute-path-exempt 跳過整份,不要為了通過而改寫規則。

/**
 * ⚠️ 家目錄那幾種前面一定要卡「不是文字字元」——
 *    專案裡本來就有 views/home/ 這種資料夾,少了這道條件,
 *    `views/home/Index.vue` 會被當成家目錄路徑,整批頁面都被誤報。
 *    真正的絕對路徑前面是行首、引號或空白,不會接在字母後面。
 */
const ABSOLUTE_PATH_RE =
  /(?<![\w.-])(?:[A-Za-z]:[\\/]|file:\/\/|\/(?:Users|home|Volumes|mnt)\/)[\w.\-\\/]*/g

/**
 * 連續往上跳三層以上的 import —— 那已經跳出專案根,指到的是別的專案。
 *
 * 只認 import 與 require 這兩種語句,而且路徑必須從引號後直接開始 ——
 * 允許前面有東西的話,一般的字串內容也會被當成路徑比對。
 */
const CROSS_PROJECT_IMPORT_RE =
  /(?:import|require)\b[^'"\n]*['"]((?:\.\.\/){3,}[^'"\n]*)['"]/g

/**
 * 這條規則**涵蓋原始碼與規範系統自身**,範圍比「不寫死專案名稱」那條大。
 *
 * 理由是兩者性質不同:品牌名稱寫在頁面裡是內容,絕對路徑不是 ——
 * 它是只在某一台開發機上成立的位置,別人 clone 下來直接壞掉,build 也不會過。
 * 寫在原始碼裡同樣是錯的,所以不限縮。
 */
const ABSOLUTE_PATH_EXEMPT_RE = /lint-absolute-path-exempt/

const checkAbsolutePath = ({ rel, text }) => {
  if (!ABSOLUTE_PATH_SCOPE.some((prefix) => rel.startsWith(prefix))) return []
  if (ABSOLUTE_PATH_EXEMPT_RE.test(text)) return []

  const issues = []
  const seen = new Set()

  for (const m of text.matchAll(ABSOLUTE_PATH_RE)) {
    if (seen.has(m[0])) continue
    seen.add(m[0])

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'absolutePath',
        `寫了絕對路徑「${m[0]}」 —— 那個位置只在特定電腦上成立,改成相對專案根目錄的路徑`
      )
    )
  }

  for (const m of text.matchAll(CROSS_PROJECT_IMPORT_RE)) {
    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'absolutePath',
        `跨專案引用 ${m[1]} —— 往上跳這麼多層已經離開專案根目錄,指到的是別人機器上才有的位置`
      )
    )
  }

  return issues
}

export const GLOBAL_CHECKS = [checkProjectName, checkAbsolutePath]

export const GLOBAL_RULE_TITLE = {
  projectName: '寫死專案名稱',
  absolutePath: '寫了某一台機器上才有的路徑',
}

export const GLOBAL_RULE_HINT = {
  projectName: '專案名稱不寫進程式碼與文件 —— 網域 / 路徑 / 識別字走環境變數或設定檔',
  absolutePath:
    '路徑一律相對專案根目錄 —— 磁碟機代號、家目錄、file://、往上跳三層以上都只在特定電腦上成立',
}
