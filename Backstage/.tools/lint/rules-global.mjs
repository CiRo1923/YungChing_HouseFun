// lint-self-contained-exempt: 這支檔案定義「不要把讀者送去別處」那條規則,
// 比對式必須把「同上」「同理」那幾個詞本身寫出來,規則才抓得到它們。
//
// 全站規範 —— 不限於 CSS,可檢查的每一種檔案都適用。
// 副檔名範圍由 project-config.mjs 的 SCANNABLE_EXTENSIONS 決定,這裡不另外列一份 ——
// 列了就會有跟它對不上的一天,而對不上的那種檔案會靜靜地不再被檢查。
//
// 這裡放的是「跟樣式無關、但每一種檔案都要守」的規則。
// CSS 專屬的規則在 lint-core.mjs,兩邊都吐同一種 issue 物件,由 lintFile 合併。

import fs from 'node:fs'
import path from 'node:path'

import {
  ABSOLUTE_PATH_SCOPE,
  WRITING_STYLE_SCOPE,
  PROJECT_NAMES,
  PROJECT_NAME_SCOPE,
  SOURCE_PROJECT_NAME,
  TOOLING_PREFIXES,
  hasExemptMark,
  issueOf,
  lineNoOf,
  listFiles,
  toRel,
  warnOf,
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
// 這裡與訊息中都**不要寫出任何實際路徑當範例** —— 那本身就是寫死路徑,
// 而且會讓人以為只有那種形狀才算違規。
//
// 專案叫什麼定義在 project-config.mjs 的 PROJECT_NAMES ——
// 名稱是每個專案各不相同的東西,寫在規則裡的話,換一個專案之後
// 這條會去抓一個與它無關的字,而它自己的名稱反而不會被抓。

/**
 * 從專案名稱組出比對式。
 *
 * 設定填的是名稱本身(`Royal Canin`),不是正規表示式 —— 換專案的人要填的是
 * 「這個專案叫什麼」,不該連帶要會寫比對式。
 *
 * 組出來的比對式涵蓋名稱的各種寫法:名稱裡的空白對應到實際寫法中的
 * 空白、底線、連字號,或是完全連在一起(`royalcanin`、`royal-canin`、
 * `Royal_Canin` 都算),大小寫一律不分。
 *
 * 名稱以外的字元會被跳脫 —— 名字裡有 `.` 或 `+` 的專案才不會變成萬用字元。
 */
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const patternOf = (name) =>
  new RegExp(name.trim().split(/\s+/).map(escapeRe).join('[\\s_-]?'), 'i')

const PROJECT_NAME_RE = PROJECT_NAMES.map(patternOf)

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

const checkProjectName = ({ rel, text }) => {
  if (!PROJECT_NAME_SCOPE.some((prefix) => rel.startsWith(prefix))) return []
  if (hasExemptMark(text, 'project-name')) return []

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
// 這條會抓到「為了定義規則而必須寫出路徑形狀」的檔案(規則本身、測試案例)。
// 那種檔案在檔頭標 lint-absolute-path-exempt 跳過整份,不要為了通過而改寫規則。
// 標記一定要寫在註解裡 —— 程式碼裡的字面值不算,否則定義比對式的那一行
// 會讓規則檔永遠豁免自己(見 shared.mjs 的 hasExemptMark)。

/**
 * 家目錄那幾種前面一定要卡「不是文字字元」——
 * 專案裡本來就有 views/home/ 這種資料夾,少了這道條件,
 * `views/home/Index.vue` 會被當成家目錄路徑,整批頁面都被誤報。
 * 真正的絕對路徑前面是行首、引號或空白,不會接在字母後面。
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

const checkAbsolutePath = ({ rel, text }) => {
  if (!ABSOLUTE_PATH_SCOPE.some((prefix) => rel.startsWith(prefix))) return []
  if (hasExemptMark(text, 'absolute-path')) return []

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

// --- 規則 plainText:不用 emoji 與裝飾符號 -----------------------------------
//
// 寫給人讀的文字裡不放 emoji,也不放拿來裝飾的符號。客戶會看到這些文字,
// 那是正式的工作文件,不是聊天訊息。
//
// 要強調就把理由寫出來,那比一個圖示有用 —— 圖示只說「這裡很重要」,
// 理由才說得出「為什麼重要、不照做會怎樣」。
//
// 兩種情況不算裝飾,所以不抓:
//
//   一、工具在終端機印出來的狀態(通過、違規、擋下、提醒各一個記號)。
//       那不是文件,是程式跑起來當下的回饋;一排訊息裡要能一眼分出哪幾筆有問題。
//       **只有印出來的那一份合法** —— 同一個記號寫進註解或文件就是裝飾,
//       照樣抓。分辨的方式是看它在不在字串裡(見 isInsideString)。
//
//   二、對照表裡表示「變成」的箭頭。那是資訊本身,不是裝飾 ——
//       換成文字反而讓整欄對不齊、更難讀,所以不分場合都放行。
//
// 兩者分別列在 TERMINAL_MARKS 與 ARROW_MARKS,其餘的圖形符號一律抓。

/**
 * 終端機的狀態記號:通過、違規、擋下、提醒。
 *
 * **只有工具印出來的那一份合法,寫在註解或文件裡就是裝飾。**
 * 印出來的那一份不是文件,是程式跑起來當下的回饋 ——
 * 一排訊息裡要能一眼分出哪幾筆通過、哪幾筆有問題、哪幾筆只是提醒。
 * 同一個字元寫進註解就沒有那個作用了,只剩下「這裡很重要」的語氣,
 * 而語氣說不出「為什麼重要、不照做會怎樣」。
 *
 * 分辨的方式是看它在不在字串裡(見 isInsideString)——
 * 工具要印出來的訊息一定是字串,註解與文件裡的則不是。
 *
 * 要再放行別的符號時加在這裡,不要改下面的偵測範圍 ——
 * 改範圍會連帶放行一整批沒想過的字元。
 */
const TERMINAL_MARKS = new Set(['✔', '✓', '✗', '⛔', '⚠'])

/**
 * 對照表裡表示「變成」的箭頭(`舊名稱 → 新名稱`)。
 *
 * 這是資訊本身,不是裝飾 —— 換成文字反而讓整欄對不齊、更難讀,
 * 所以不分場合一律放行。
 */
const ARROW_MARKS = new Set(['→', '←', '↔'])

/**
 * 這個位置在不在字串裡。
 *
 * 用來分辨「工具要印出來的訊息」與「寫給人讀的註解」——
 * 前者一定包在引號裡,後者不是。
 *
 * 只看同一行:跨行的模板字串會被判成不在字串裡,那個方向是「多報一筆」,
 * 看到的人自己判斷得出來;反過來放行才危險 —— 漏掉的裝飾符號不會有人發現。
 *
 * 跳脫過的引號(`\'`)不算開頭或結尾,否則一句 `don\'t` 會把後面整行
 * 都算成字串外,那一行的符號就全部漏掉。
 */
const isInsideString = (line, index) => {
  const quotes = { "'": 0, '"': 0, '`': 0 }

  for (let i = 0; i < index; i += 1) {
    const char = line[i]
    if (char === '\\') {
      i += 1
      continue
    }
    if (char in quotes) quotes[char] += 1
  }

  return Object.values(quotes).some((count) => count % 2 === 1)
}

/**
 * 圖形符號與 emoji 的字元範圍 —— 各類圖示、雜項符號、裝飾記號與箭頭。
 *
 * **不含變體選擇子**(跟在符號後面讓它顯示成彩色的那個字元)。
 * 那個字元本身不顯示任何東西,不是一個可以獨立存在的符號 ——
 * 該不該報,由它前面那個符號決定就好。
 *
 * 把它放進字元類還會有另一個問題:那等於宣告「這個字元單獨出現也算違規」,
 * 而它從來不會單獨出現。清掉前面的符號時它會一起被清掉,不必另外抓。
 */
const DECORATIVE_RE = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu


const checkPlainText = ({ rel, text }) => {
  if (!WRITING_STYLE_SCOPE.some((prefix) => rel.startsWith(prefix))) return []
  if (hasExemptMark(text, 'plain-text')) return []

  const issues = []
  const seen = new Set()

  const lines = text.split('\n')

  for (const m of text.matchAll(DECORATIVE_RE)) {
    const mark = m[0]

    if (ARROW_MARKS.has(mark)) continue

    const line = lineNoOf(text, m.index)

    /* 狀態記號只有工具印出來的那一份合法 —— 判斷它在不在字串裡。
       行內位置要從整份文字的位置換算回來:比對是對整份做的,
       而判斷字串只看同一行。 */
    if (TERMINAL_MARKS.has(mark)) {
      const lineStart = text.lastIndexOf('\n', m.index - 1) + 1
      if (isInsideString(lines[line - 1], m.index - lineStart)) continue
    }

    // 同一個符號只報一次 —— 一份文件裡同一個圖示常常出現幾十次
    if (seen.has(mark)) continue
    seen.add(mark)

    issues.push(
      issueOf(
        rel,
        line,
        'plainText',
        `用了裝飾符號「${mark}」 —— 這些文字客戶會看到,要強調就把理由寫出來;` +
          `工具印出來的狀態記號(寫在字串裡的那些)與對照表的箭頭不在此限`
      )
    )
  }

  return issues
}

// --- 規則 selfContained:讀者不必離開現在這一段 -------------------------------
//
// 「同上」「同 1」「參考第三節」這類寫法不行 —— 它們把資訊留在別的地方,
// 強迫讀者跳走。
//
// 讀的人多半是帶著一個具體問題來的,從搜尋結果或某一節的中間開始看,
// 沒有「上一段」可以參照。被送去另一個地方之後,還要自己找回原本在看什麼 ——
// 跳兩次就放棄了。
//
// 同一件事出現在很多地方時,挑一個地方寫完整,其餘各自寫一段短的。
// 內容重複完全沒問題,重複遠比指涉好:同一句話在三個地方各寫一次,
// 讀者三次都讀得懂;寫成「同上」則是三個地方都讀不懂。
//
// **指向別的檔案不算**(「完整清單見某某文件」)。那是有用的補充,
// 前提是這一段自己要講的已經講完了。這條抓的是「指向同一份文件裡的別處」。

/**
 * 把讀者送回同一份文件別處的寫法。
 *
 * 兩類:
 *   一、直接說「跟前面一樣」(同上、同前述、如前所述)
 *   二、指名文件內部的位置(參考第三節、見上一段、同第 1 點)
 *
 * 中文句子裡詞與詞之間沒有空格,所以不能要求這些詞前面一定是標點 ——
 * 「這段的規則同上」的「同上」前面就是一個中文字,加了條件會整批漏抓。
 * 有誤報風險的詞(「同理」會出現在「同理心」)改用後置排除處理。
 */
const CROSS_REFERENCE_RE = new RegExp(
  [
    /* 「同上」「同前」後面不能再接中文字 —— 接了就是別的詞:
       「共同前提」的前是前提、「同前綴」的前是前綴、「相同上限」的上是上限。
       真的在說「跟前面一樣」時,後面是標點、換行,或是述 / 面 / 一點這幾個接續。

       前面也要卡:共 / 相 / 不 開頭的話,那個「同」屬於前面那個詞。 */
    '(?<![共相不])同上(?:所述)?(?![\\u4e00-\\u9fff])',
    '(?<![共相不])同前(?:述|面|一[點條節])?(?![\\u4e00-\\u9fff])',
    '[如承]上所述',
    '如前所述',
    '承上',
    // 「同理」後面接字就不是指涉(同理心、同理可證的「可證」另計)
    '同理(?![心念解])',
    /* 「同 2」這種省略量詞的寫法也要抓 —— 量詞寫成可選。
       但前面不能接「相」「不」「雷」:「相同 2 個條件」「不同 3 種寫法」
       是正常句子,那個「同」屬於前面那個詞,不是「跟第 2 點一樣」的意思。 */
    '(?<![相不雷])同第?\\s*\\d+\\s*[點條項節]?',
    '參[考照](?:上|前|第)\\s*[\\d一二三四五六七八九十]*\\s*[點條項節章單元段]',
    '[見詳](?:上|前)\\s*[一]?\\s*[點條項節章段]',
  ].join('|'),
  'g'
)


const checkSelfContained = ({ rel, text }) => {
  if (!WRITING_STYLE_SCOPE.some((prefix) => rel.startsWith(prefix))) return []
  if (hasExemptMark(text, 'self-contained')) return []

  const issues = []
  const seen = new Set()

  for (const m of text.matchAll(CROSS_REFERENCE_RE)) {
    const phrase = m[0]

    // 同一種寫法只報一次 —— 一份文件裡同一個詞常常出現好幾十次
    if (seen.has(phrase)) continue
    seen.add(phrase)

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'selfContained',
        `寫了「${phrase}」 —— 讀的人多半從中間開始看,沒有「上一段」可以參照;` +
          `把那段要講的在這裡再寫一次,內容重複沒關係,重複遠比讓讀者跳頁好`
      )
    )
  }

  return issues
}

// --- 規則 configItem:專案設定檔只改值,不新增項目 ----------------------------
//
// 專案設定檔是規則與專案之間的介面:一邊是規則(換專案完全不動),
// 另一邊是這個專案的資料夾怎麼擺。**介面的形狀由規則那一側決定** ——
// 規則讀什麼,設定檔才有什麼。
//
// 每個專案只做一件事:把既有的項目改成自己的值。自己多加一項的話,
// 沒有任何規則會讀它 —— 不是「設定沒生效」的錯誤訊息,是完全的安靜,
// 而下一個人看到它會以為某條規則吃這個值。這條抓的就是那種項目。
//
// 反方向(刪掉或改名)不必抓:規則 import 的名稱不存在時,
// 那條規則會直接壞掉,本來就看得見。
//
// **判準是「有沒有人用」,不是「來源長什麼樣」。** 規範工具與使用它的專案
// 之後會分開放,那時這條照樣成立 —— 它問的是這個專案裡有沒有程式讀它。
//
// 來源那一邊不擋,只提醒:規則與設定在那裡是一起長出來的,
// 先加設定、再改規則去讀它,中間必然有一段「還沒有人用」的狀態。
// 那是正常的工作過程,擋下來只會讓人繞過檢查。

/** 設定檔在規範工具自己的目錄裡,那個位置不隨專案而不同 */
const CONFIG_FILE = '.tools/lint/project-config.mjs'

const CONFIG_EXPORT_RE = /^export const ([A-Za-z_$][\w$]*)/gm

/**
 * 會讀設定的程式碼 —— 規範系統自己那幾個目錄底下,扣掉說明文件。
 *
 * 文件不算讀者:文件提到某個設定的名字是在說明它,不是在用它。
 * 把文件算進來的話,一個沒有任何規則讀、只有文件寫過的設定會被判成有人用。
 */
const toolingSourcesOf = (root) =>
  TOOLING_PREFIXES.flatMap((prefix) => listFiles(root, prefix.replace(/\/$/, '')))
    .map((abs) => toRel(root, abs))
    .filter((rel) => rel !== CONFIG_FILE && !rel.endsWith('.md'))
    .map((rel) => {
      try {
        return fs.readFileSync(path.resolve(root, rel), 'utf8')
      } catch {
        return ''
      }
    })

/**
 * 設定檔裡沒有任何人讀的項目 —— 回傳 `{ name, index }`。
 *
 * 判準抽成純函式是為了讓規則的自我驗證能直接測它:這條規則只對設定檔
 * 那一個路徑生效,驗證沒辦法像別條那樣造一支探測檔 ——
 * 造出來的話就是覆寫真正的設定檔。
 */
export const unusedConfigNames = (text, sources) =>
  [...text.matchAll(CONFIG_EXPORT_RE)].flatMap((m) => {
    const name = m[1]
    const nameRe = new RegExp(`\\b${name}\\b`)

    if (sources.some((src) => nameRe.test(src))) return []

    /* 設定檔自己用到也算 —— 有些項目是用來組出別的項目的中介值,
       它們不會被規則直接讀,但拿掉之後別的項目就算不出來。
       宣告本身就是一次出現,所以要兩次以上才算「自己也有用到」。 */
    if (text.split(nameRe).length > 2) return []

    return [{ name, index: m.index }]
  })

/**
 * 這個專案是不是規範工具的來源。
 *
 * 拿設定裡的來源名稱與這個專案自己的名稱比對 —— 對得上就是來源。
 * 每個專案安裝時本來就要把專案名稱換成自己的(不換的話,「不寫死專案名稱」
 * 那條會去抓一個與它無關的字),換掉之後兩者自然對不上,就不再是來源。
 *
 * 比對走的是專案名稱那一套寫法,空白、底線、連字號、大小寫的差異都算同一個名字 ——
 * 兩處各寫一種比對方式的話,同一個名字會有一邊算相符、另一邊算不相符。
 *
 * 對外提供是為了讓前提檢查印出「這次被判定為來源」—— 那個判斷只有這一份,
 * 另一處自己再算一次的話,兩邊會有對不上的一天,而工具講的話就開始與行為不符。
 */
export const IS_SOURCE_PROJECT =
  !!SOURCE_PROJECT_NAME && PROJECT_NAMES.some((name) => patternOf(name).test(SOURCE_PROJECT_NAME))

const checkConfigItem = ({ root, rel, text }) => {
  if (rel !== CONFIG_FILE) return []

  return unusedConfigNames(text, toolingSourcesOf(root)).map(({ name, index }) => {
    const line = lineNoOf(text, index)

    /* 來源那一邊只提醒:規則與設定是一起長的,先加設定、再改規則去讀它,
       中間必然有一段「還沒有人用」的狀態。 */
    if (IS_SOURCE_PROJECT) {
      return warnOf(
        rel,
        line,
        'configItem',
        `${name} 目前沒有任何規則讀它 —— 這個專案是規範工具的來源,所以只是提醒;` +
          `規則那一側還沒改完的話這是正常的,確定不會用到就把它拿掉`
      )
    }

    return issueOf(
      rel,
      line,
      'configItem',
      `${name} 沒有任何規則讀它 —— 設定項有哪些由規範工具的來源決定,` +
        `專案只把既有項目改成自己的值;多出來的一項不會有任何作用,` +
        `而下一個人會以為某條規則吃這個值`
    )
  })
}

export const GLOBAL_CHECKS = [
  checkProjectName,
  checkAbsolutePath,
  checkPlainText,
  checkSelfContained,
  checkConfigItem,
]

export const GLOBAL_RULE_TITLE = {
  projectName: '寫死專案名稱',
  absolutePath: '寫了某一台機器上才有的路徑',
  plainText: '用了 emoji 或裝飾符號',
  selfContained: '把讀者送去別處的寫法(同上 / 參考第幾節)',
  configItem: '專案設定檔多了沒有規則讀的項目',
}

export const GLOBAL_RULE_HINT = {
  projectName: '專案名稱不寫進程式碼與文件 —— 網域 / 路徑 / 識別字走環境變數或設定檔',
  absolutePath:
    '路徑一律相對專案根目錄 —— 磁碟機代號、家目錄、file://、往上跳三層以上都只在特定電腦上成立',
  plainText: '要強調就把理由寫出來 —— 終端機的狀態記號與對照表的箭頭不在此限',
  selfContained: '把那段要講的在這裡再寫一次 —— 內容重複沒關係,重複遠比讓讀者跳頁好',
  configItem:
    '專案設定檔只把既有項目改成自己的值 —— 需要新的一項代表規則本身要改,回到規範工具的來源去加',
}
