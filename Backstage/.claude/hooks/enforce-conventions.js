// PostToolUse hook:檢查專案慣例,只提醒、不阻擋。
//
// 對應的完整規則:
//   .claude/skills/routing-conventions/SKILL.md
//   .claude/skills/shared-components-sync/SKILL.md
//
// 跨電腦共用 → 腳本放在專案內並進版控,settings.json 只負責呼叫。
// package.json 是 "type": "module",所以這裡用 ESM 語法。

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

// 規則 1:pages/ 下的路由檔名一律全小寫(_components 內是元件,PascalCase 才對)
const onCheckPageFileName = (filePath) => {
  // 統一成正斜線再判斷,Windows 的反斜線路徑才比對得到
  const path = filePath.replaceAll('\\', '/')

  if (!/\/pages\//.test(path) || !path.endsWith('.vue')) return null
  if (path.includes('/_components/')) return null

  const fileName = path.split('/').pop()

  if (!/[A-Z]/.test(fileName)) return null

  return `[routing-conventions] pages/ 下的檔名會原樣變成 URL(不轉大小寫):「${fileName}」含大寫字母,使用者手打小寫網址會 404。請改為全小寫、多字用連字號。`
}

// 規則 2:mForm / mPopup / ImgSrc / SvgIcon 是 Backstage / Official 兩邊共用的元件,
// 功能必須一致(樣式各自照設計走)
const SHARED_COMPONENTS = [
  { pattern: /\/components\/common\/mForm\//, name: 'mForm' },
  { pattern: /\/components\/common\/mPopup\//, name: 'mPopup' },
  { pattern: /\/components\/common\/ImgSrc\.vue$/, name: 'ImgSrc' },
  { pattern: /\/components\/common\/SvgIcon\.vue$/, name: 'SvgIcon' },
]

const onCheckSharedComponent = (filePath) => {
  const path = filePath.replaceAll('\\', '/')
  const matched = SHARED_COMPONENTS.find((item) => item.pattern.test(path))

  if (!matched) return null

  return `[shared-components-sync] ${matched.name} 是 Backstage / Official 共用元件。這次若動到「功能」(config / props / emits / 行為),要同步到另一個專案;純樣式調整則不用。規則見 .claude/skills/shared-components-sync/SKILL.md。`
}

// 規則 3:新檔案就是「新結構」—— 沿用既有的板,不要自己發明
//
// 對應規則:.claude/rules/no-assumption.md
//
// 判斷方式是「git 還不認識這個檔案」。改既有檔案不會觸發,只有真的多開一支才會 ——
// 這正是最容易自己發明結構的時刻(順手拆一個元件、多開一層資料夾)。
// 使用者明確要求開的檔案也會被提醒,那沒關係:確認過就忽略一行字。
const onCheckNewFile = (filePath) => {
  const path = filePath.replaceAll('\\', '/')

  if (!/\.(vue|js|mjs|css)$/.test(path)) return null
  // 規則講的是產品程式碼的結構,工具與設定不在此限
  if (/(^|\/)(\.claude|\.tools|\.vite|node_modules)\//.test(path)) return null

  let isTracked = true

  try {
    execFileSync('git', ['ls-files', '--error-unmatch', filePath], { stdio: 'ignore' })
  } catch (error) {
    // exit 1 才是「git 不認識這個檔案」。其他失敗(128 = 不是 repo、
    // ENOENT = 找不到 git)代表**無法判斷**,那就當既有檔案處理 ——
    // 提醒錯了比漏提醒更糟:每次寫檔都跳一次,很快就會被當雜訊忽略。
    isTracked = error.status !== 1
  }

  if (isTracked) return null

  const fileName = path.split('/').pop()

  return (
    `[no-assumption] 「${fileName}」是新檔案 —— 也就是新結構。` +
    `動手前先 grep 既有的同類頁面 / 元件怎麼做,找到就照抄那個板(連文案與 config 欄位名都照抄);` +
    `找不到或有兩種以上做法就**停下來問**,不要自己選。規則見 .claude/rules/no-assumption.md。`
  )
}

// 以下兩條都要看檔案內容。讀不到就跳過(hook 只是提醒),並排除工具與依賴目錄。
const CONTENT_EXTENSIONS = /\.(vue|js|mjs|ts|css|md)$/
const CONTENT_SKIP_DIRS = /(^|\/)(node_modules|\.output|\.nuxt|dist)\//

const onReadContent = (filePath) => {
  const path = filePath.replaceAll('\\', '/')

  if (!CONTENT_EXTENSIONS.test(path) || CONTENT_SKIP_DIRS.test(path)) return null

  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}

/* 規則與 skill 文件會「列舉」它自己要禁止的字眼(例如寫著「不要用同上」),
  那不是違規而是規則本體。靠字詞比對的三條檢查(client-tone / root-cause-fix / writing-style)因此要跳過這裡,否則每次修規則都跳一次誤報,很快就會被當雜訊。

  emoji 與絕對路徑那兩條**不跳過** —— 規則文件一樣不該有那些東西。 */
const onIsRuleDoc = (filePath) =>
  /(^|\/)\.claude\/(rules|skills)\/.*\.md$/.test(filePath.replaceAll('\\', '/'))

// 規則 4:這是與客戶共同開發的專案 —— 註解與文件只記錄「邏輯」,
// 不記錄「誰弄錯了什麼」。
//
// 對方讀得到這個 repo,而「規格上一版寫錯、設計稿是錯的、某天更正」這類敘述,
// 對讀程式的人沒有任何幫助(要知道的是現在的行為與為什麼這樣做),
// 卻會變成翻舊帳的紀錄。判斷方式:把那句話唸給客戶聽,會不會尷尬。
//
// 需要記「還沒定案 / 待確認」是可以的 —— 那是待辦,寫成「要問後端能不能提供 X」,
// 而不是「後端漏了 X」。
const BLAME_WORDS = [
  '誤寫',
  '寫錯',
  '標錯',
  '轉譯錯誤',
  '是錯的',
  '是錯誤的',
  '設計稿錯',
  '規格錯',
  '早一版',
  '舊版規格',
  '後端漏',
  '沒寫清楚',
]

const onCheckClientBlame = (content, filePath) => {
  if (!content || onIsRuleDoc(filePath)) return null

  const hits = BLAME_WORDS.filter((word) => content.includes(word))

  if (!hits.length) return null

  return (
    `[client-tone] 這個 repo 與客戶共同開發 —— 註解與文件只記錄邏輯,不記錄「哪一版寫錯、誰弄錯」。` +
    `這次寫入含有:${hits.join('、')}。` +
    `改成描述「現在的行為與為什麼」;若是待確認事項,寫成「要問後端能不能提供 X」而不是「後端漏了 X」。`
  )
}

// 規則 5:盡可能不要用 emoji —— 註解、文件、訊息都一樣。
//
// 它在等寬字型下寬度不一致(對齊會歪)、終端機與 diff 常顯示成豆腐或問號,
// 而且傳達不了任何程式資訊:該強調就把話寫清楚。
// 需要視覺分級時用文字前綴(「注意:」「必讀:」)。
const EMOJI_RE = /[\p{Extended_Pictographic}\u2713\u2714\u2717\u2718]/gu

const onCheckEmoji = (content) => {
  if (!content) return null

  // 去掉 U+FE0F(變體選擇子):它不會單獨出現,跟在符號後面才變成彩色 emoji,
  // 留著會讓訊息多印一個看不見的字元。
  const hits = [
    ...new Set((content.match(EMOJI_RE) ?? []).map((char) => char.replace(/\uFE0F/g, ''))),
  ]

  if (!hits.length) return null

  return (
    `[no-emoji] 盡可能不要用 emoji 符號。這次寫入含有:${hits.join(' ')}。` +
    `請刪掉,需要強調就用文字(「注意:」「必讀:」)—— emoji 在等寬字型下寬度不一致,` +
    `終端機與 diff 也常顯示不出來。`
  )
}

// 規則 6:修在根因,不要往上堆
//
// 對應規則:.claude/rules/root-cause-fix.md
//
// 「這是不是繞過」是判斷題,靜態抓不到 —— 但有一個訊號抓得到:
// 程式碼裡自己承認這是權宜的字眼。會寫下「暫時」的人,當下就知道自己在繞。
//
// 這條不是要禁止繞過(有時候真的只能繞),而是要它「被看見」:
// 規則要求繞過時必須寫明根因在哪、為什麼當下不修。只寫「暫時這樣」是不夠的。
const WORKAROUND_WORDS = ['暫時', '暫解', '先這樣', '先擋', '之後再', 'workaround', 'hack']

const onCheckWorkaround = (content, filePath) => {
  if (!content || onIsRuleDoc(filePath)) return null

  const hits = WORKAROUND_WORDS.filter((word) => content.includes(word))

  if (!hits.length) return null

  return (
    `[root-cause-fix] 這次寫入含有:${hits.join('、')} —— 看起來是繞過而不是修根因。` +
    `先確認根因在哪一層,能修就修在那裡;根因在共用元件 / 影響面大而不能當下修的話,` +
    `註解要寫明**根因在哪一支檔案**與**為什麼現在不修**,回覆也要明講「這是繞過,不是修好」。` +
    `規則見 .claude/rules/root-cause-fix.md。`
  )
}

// 規則 7:讀的人不必離開現在這一段
//
// 對應規則:.claude/rules/writing-style.md
//
// 判準是「看這一段的人需不需要跑到別的地方才看得懂」,不是「有沒有用某幾個詞」。
// 讀的人多半是搜尋或從目錄跳進來的,「上面」對他不存在;
// 往回翻也不一定找得到 —— 檔案被拆過、順序被調過、那段已經刪了。
// 解法是把內容直接再寫一次:重複幾行字的成本,遠低於讀的人翻不到的成本。
//
// 這裡只抓得到最常見的幾個字眼。換個說法而讀者還是得跳出去,一樣不合格,
// 那部分只能靠人判斷。
//
// 「同一」「同時」「相同」不在清單裡:全案掃過,那些都是正常的中文用詞
// (同一個門檻值、同一套寫法、同一個名字),不是指涉。
const REFERENCE_WORDS = ['同上', '同前', '如上', '見上', '同下', '上述', '前述', '同理', '理由同']
/* 「同 1」「同 2」這種編號指涉。後面接量詞的是正常用法(同 2 個、同 3 次),要排除。

  注意:空白要寫在 lookahead 裡面,不能寫成 `\d+\s*(?!…)` ——
      那樣寫時 `\s*` 會回溯成 0 個字元,lookahead 看到的是空格而不是量詞,
      於是「同 2 個」這種正常用法會被誤判。 */
const REFERENCE_NUMBER_RE = /同\s*\d+(?!\s*[個支筆件年月日次分秒台份人組])/

const onCheckReference = (content, filePath) => {
  if (!content || onIsRuleDoc(filePath)) return null

  const hits = REFERENCE_WORDS.filter((word) => content.includes(word))
  const matched = content.match(REFERENCE_NUMBER_RE)

  if (matched) hits.push(matched[0].trim())
  if (!hits.length) return null

  return (
    `[writing-style] 註解 / 文件裡出現指涉:${hits.join('、')} —— 讀的人得跳出這一段才看得懂。` +
    `他多半是搜尋或從目錄跳進來的,「上面」對他不存在,往回翻也不一定找得到` +
    `(檔案拆過、順序調過、那段被刪了)。**把內容直接再寫一次就好,重複沒有關係**;` +
    `連結也算跳離,只用在「想深入才點」的補充,並附上檔名與段落標題。` +
    `規則見 .claude/rules/writing-style.md。`
  )
}

/* 規則 8:不要寫絕對路徑,也不要寫死專案名稱

  對應規則:.claude/rules/writing-style.md

  這些檔案會被複製到別的專案、被不同的人在不同的電腦上打開。
  絕對路徑在別人的機器上一定是錯的 —— 每個人的存放位置不同,
  而且有人用 Windows、有人用 mac,連磁碟機代號與路徑分隔符都不一樣。
  一律改成從專案根目錄起算的相對路徑。

  專案名稱同理:寫死了,複製到另一個專案就變成錯的敘述。
  這裡只抓得到「路徑裡帶專案名」的情況(那是最常見的),
  單獨出現在句子裡的專案名靠人判斷。 */
/* 四種形狀都要抓,不能只認一種作業系統:

    1. 磁碟機代號開頭          Windows
    2. 家目錄與掛載點開頭      mac 的家目錄與外接碟、Linux 的家目錄與掛載點
    3. file:// 協定
    4. 連續往上跳三層以上的相對路徑 —— 那已經跳出專案根,等於引用別的專案

  注意:家目錄那幾種前面一定要卡「不是文字字元」。少了這道條件,
      專案裡本來就有的 views/home/ 這種資料夾會被當成家目錄路徑,整批頁面被誤報。
      真正的絕對路徑前面是行首、引號或空白,不會接在字母後面。 */
const ABSOLUTE_PATH_RES = [
  { re: /file:\/\/\/?[^\s)"'`]+/g, name: 'file:// 開頭的連結' },
  { re: /\b[A-Za-z]:[\\/][^\s)"'`,;]+/g, name: '磁碟機代號開頭的路徑' },
  {
    re: /(?<![\w.-])\/(?:Users|home|Volumes|mnt)\/[^\s)"'`]+/g,
    name: '家目錄或掛載點開頭的路徑',
  },
  {
    re: /(?:import|require)\b[^'"\n]*['"]((?:\.\.\/){3,}[^'"\n]*)['"]/g,
    name: '往上跳三層以上的 import(等於引用別的專案)',
  },
]

/* 規則本身與測試案例必須寫出路徑的形狀,那不是違規。
  這個標記與其他專案的 lint 規則同名,將來要把這條升級成 lint 時不必改標記。 */
const ABSOLUTE_PATH_EXEMPT_RE = /lint-absolute-path-exempt/

const onCheckAbsolutePath = (content) => {
  if (!content || ABSOLUTE_PATH_EXEMPT_RE.test(content)) return null

  const hits = []

  for (const { re, name } of ABSOLUTE_PATH_RES) {
    const matched = content.match(re)

    if (matched) hits.push(`${name}(例如 ${matched[0].trim().slice(0, 40)})`)
  }

  if (!hits.length) return null

  return (
    `[writing-style] 這次寫入含有絕對路徑:${hits.join('、')}。` +
    `這些檔案會被複製到別的專案、被不同的人在不同的電腦上打開 —— ` +
    `每個人的存放位置不同,作業系統也不同(Windows 與 mac 連路徑分隔符都不一樣),` +
    `絕對路徑在對方機器上一定是錯的。請改成從專案根目錄起算的相對路徑。` +
    `規則見 .claude/rules/writing-style.md。`
  )
}

/* 規則 9:不要寫死專案名稱

  對應規則:.claude/rules/writing-style.md 的「五、不寫專案名稱」

  這些檔案會整批複製到下一個專案。名稱寫進去之後,搬過去就變成錯的敘述,
  而且從內容看不出哪幾句是「本專案限定」。要指稱這個專案時就寫「本專案」。

  注意:清單**只填本專案自己的名稱**。不要把別的專案名稱列進來 ——
      那等於把別人的專案名寫死在這支檔案裡,正好是這條規則要防的事;
      而且這份清單會跟著專案複製出去。

  注意:前面要卡「不是英文字母」。少了這道條件,`inhouse` 這種正常的英文字
      (in-house,自製)會被當成專案名,而專案裡本來就有那個字。 */
const PROJECT_NAME_RES = [/(?<![a-z])house[\s_-]?fun/i, /(?<![a-z])yung[\s_-]?ching/i]

const PROJECT_NAME_EXEMPT_RE = /lint-project-name-exempt/

/* 這條的適用範圍**只有規範所在的位置** —— 那些檔案會整批複製到下一個專案。

  注意:原始碼不在範圍內,而且是刻意的。專案名稱在那裡有一堆正當用途:

    畫面上的品牌名稱        頁面 title、頁首頁尾的文字
    與後端約定的常數        加密用的 key 與 iv,改了就對不上
    全域變數的命名空間前綴  掛在 window 上時用來避免與其他腳本衝突

  把原始碼放進來會產生幾十筆全部都是正當使用的提醒,很快就會被當雜訊忽略,
  連真正該抓的規範檔案也一起被忽略。

  設定檔(package.json 那類)同樣不在範圍內 ——
  它的 name 欄位就是專案名,那不是寫死,是它的用途。 */
const PROJECT_NAME_SCOPE = /(^|\/)(\.claude|\.tools|\.vite|\.githooks)\//

const onCheckProjectName = (content, filePath) => {
  if (!content || PROJECT_NAME_EXEMPT_RE.test(content)) return null

  const path = filePath.replaceAll('\\', '/')

  if (!PROJECT_NAME_SCOPE.test(path)) return null

  const hits = []

  for (const re of PROJECT_NAME_RES) {
    const matched = content.match(re)

    if (matched) hits.push(matched[0])
  }

  if (!hits.length) return null

  return (
    `[writing-style] 這次寫入含有專案名稱:${hits.join('、')}。` +
    `規則、工具與 skill 會整批複製到下一個專案 —— 名稱寫進去之後,搬過去就變成錯的敘述,` +
    `而且從內容看不出哪幾句是「本專案限定」。要指稱這個專案就寫「本專案」;` +
    `網域、路徑、識別字走環境變數或設定檔。` +
    `真的必須寫出來(記錄實際服務位置的清單那類)就在檔頭標 lint-project-name-exempt 並寫明理由。` +
    `規則見 .claude/rules/writing-style.md 的「五、不寫專案名稱」。`
  )
}

let input = ''

process.stdin
  .on('data', (chunk) => (input += chunk))
  .on('end', () => {
    try {
      const data = JSON.parse(input)
      const filePath = data?.tool_input?.file_path || data?.tool_response?.filePath || ''

      if (!filePath) return

      const content = onReadContent(filePath)
      const messages = [
        onCheckPageFileName(filePath),
        onCheckSharedComponent(filePath),
        onCheckNewFile(filePath),
        onCheckClientBlame(content, filePath),
        onCheckEmoji(content),
        onCheckWorkaround(content, filePath),
        onCheckReference(content, filePath),
        onCheckAbsolutePath(content),
        onCheckProjectName(content, filePath),
      ].filter(Boolean)

      if (!messages.length) return

      process.stdout.write(JSON.stringify({ systemMessage: messages.join('\n') }))
    } catch {
      // 解析失敗就靜靜跳過:hook 只是提醒,不該影響工作流程
    }
  })
