// 程式碼撰寫規範 —— import 路徑、composable 宣告順序、已淘汰的寫法。
//
// 這三條原本只有 PreToolUse 的阻擋式 hook(.claude/hooks/enforce-*.cjs),
// 也就是**只有 AI 寫檔時才檢查,人自己寫的完全不會被抓**;而且判斷邏輯有兩份,
// 遲早會漂移。收進引擎之後五層守門都適用,判斷只留這一份。

import fs from 'node:fs'
import path from 'node:path'
import {
  BUILD_CONFIG_FILES,
  COMPONENTS_DIR,
  IMPORT_ORDER_GROUPS,
  PROJECT_CONFIG_FILES,
  STYLE_CONFIG_FILES,
  isInActionsDir,
  isInSrc,
  VIEWS_DIR,
  issueOf,
  lineNoOf,
} from './shared.mjs'

/* 「這個檔案是不是原始碼」的判斷收在 shared.mjs 一份 —— 原始碼放在哪由設定決定,
   而且有的專案沒有 src 這一層(頁面、store 直接放專案根)。
   各規則自己比對前綴的話,那種擺法會讓前綴永遠比對不成立,規則靜靜地不再檢查任何東西。 */
const isSourceFile = (rel) => isInSrc(rel) && /\.(m?js|cjs|ts|vue)$/i.test(rel)

// 行為(actions)檔的判斷:在放行為的那個子資料夾底下,而且檔名是 useXxxActions.js。
// 前半段的判斷收在 shared.mjs 一份 —— 子資料夾叫什麼由設定決定,
// 這裡再寫死一次的話,換一個命名的專案這條會靜靜地不再命中任何檔案。
const isActionsFile = (rel) => isInActionsDir(rel) && /\/use\w*Actions\.js$/.test(rel)

/** 註解行(單行 // 或 block comment 內的 * 行) */
const isCommentLine = (line) => /^\s*(?:\/\/|\/\*|\*)/.test(line.trim() ? line : ' ')

// --- 規則 importAlias:離開自己資料夾要用 alias ------------------------------
//
// 相對路徑含 `..` 且解析後落在某個 alias 目錄下 → 改用**最深層**那個 alias。
// 同層的 ./Foo 不管(那是正常寫法,擋了只會製造噪音)。
//
// 為什麼:`../../../scripts/_api/x.js` 這種路徑,搬動檔案時要一層層重算,
// 而且看不出它到底指到哪裡。alias 寫法搬檔案時完全不用改。
//
// alias 表直接讀專案的建置設定,不另外維護一份 —— 兩份表就會有對不上的一天,
// 而且對不上的時候規則會指向一個不存在的 alias。
// 每個專案的 alias 各不相同,讀設定檔也讓這條規則不必為了換專案而改。
//
// 設定檔叫什麼名字因建置工具而異(Vite、Nuxt、webpack,還有 .ts / .mjs 的寫法),
// 所以檔名列成候選清單放在 project-config.mjs,這裡由前往後找第一支存在的。
// 一支都沒有時這條規則會被略過,並在啟動檢查時列出來,不會安靜地失效。

/**
 * resolve.alias 的兩種常見寫法,都要認:
 *
 *   '@x': fileURLToPath(new URL('要對應的路徑', import.meta.url))
 *   '@x': path.resolve(process.cwd(), `要對應的路徑`)
 *
 * 路徑裡可能帶 ${CONFIG.xxx},那些值在專案設定檔裡,取出來替換掉。
 *
 * 冒號到路徑之間允許有逗號 —— path.resolve(process.cwd(), '…') 這種寫法
 *    中間就隔著一個逗號,不允許的話這幾條 alias 全部讀不到,
 *    規則會改而建議比較淺的那一個(例如該用 @js 卻建議 @)。
 */
const ALIAS_ENTRY_RE = /['"](@[\w-]*)['"]\s*:\s*[^\n]*?['"`]([^'"`\n]+)['"`]/g
const CONFIG_VALUE_RE = /\$\{\s*CONFIG\.(\w+)\s*\}/g

let aliasCache = null

/** 候選檔名裡第一支實際存在的,找不到回 null */
const firstExisting = (root, names) => {
  for (const name of names) {
    const file = path.join(root, name)
    if (fs.existsSync(file)) return file
  }

  return null
}

/** 建置設定檔在哪(給「缺前提就說出來」的檢查用) */
export const buildConfigPathOf = (root) => firstExisting(root, BUILD_CONFIG_FILES)

/** 專案設定檔裡的簡單字串值,用來替換 alias 路徑中的 ${CONFIG.xxx} */
const readConfigValues = (root) => {
  const file = firstExisting(root, PROJECT_CONFIG_FILES)
  const values = {}

  if (!file) return values

  try {
    // 設定檔是 ESM,同步讀取解析不了 —— 取字串值用正規表示式就夠
    const text = fs.readFileSync(file, 'utf8')
    for (const m of text.matchAll(/\b(\w+)\s*:\s*['"`]([^'"`]+)['"`]/g)) {
      values[m[1]] = m[2]
    }
  } catch {
    // 讀不到就讓 ${CONFIG.xxx} 原樣留著,那條 alias 對不到路徑而已,不影響其他條
  }

  return values
}

/**
 * 專案有哪些 alias,由深到淺排列(深的優先配對)。
 *
 * 每一筆是 { alias, root } —— alias 是寫在 import 裡的名字(例如 `@components`),
 * root 是它實際指向的絕對路徑。
 *
 * 對外提供是為了讓規則的自我驗證能造出「這個專案真的會命中」的測試資料 ——
 * 每個專案的 alias 各不相同,驗證寫死某一個 alias 名稱的話,
 * 換一個專案那則驗證就永遠不會命中,看起來像規則壞了。
 */
export const aliasListOf = (root) => buildAliasMap(root)

const buildAliasMap = (root) => {
  if (aliasCache?.root === root) return aliasCache.list

  const map = {}
  const buildConfig = buildConfigPathOf(root)

  if (buildConfig) {
    try {
      const text = fs.readFileSync(buildConfig, 'utf8')
      const configValues = readConfigValues(root)

      for (const m of text.matchAll(ALIAS_ENTRY_RE)) {
        let resolved = true

        /* 設定檔裡查不到值的就整條跳過 —— 硬換成空字串會讓路徑往上縮一層
          (例如 `src/${CONFIG.fonts}` 變成 `src/`),那條 alias 就變成指向
          原始碼根目錄,規則會拿它去比對每一個 import。 */
        const target = m[2].replace(CONFIG_VALUE_RE, (_, key) => {
          if (configValues[key]) return configValues[key]
          resolved = false
          return ''
        })

        if (resolved && target) map[m[1]] = target
      }
    } catch {
      // 讀不到建置設定就不做這條檢查,不要因此讓整支規則失效
    }
  }

  // 依 root 長度由深到淺,才會優先配到最深的 alias
  const list = Object.entries(map)
    .map(([alias, rel]) => ({ alias, root: path.resolve(root, rel) }))
    .sort((a, b) => b.root.length - a.root.length)

  /* 讀到東西才記住。一筆都沒有的結果不快取 —— 建置設定可能是稍後才出現的
     (例如剛建立的專案),把「當時還沒有」記成結論的話,這條規則在這一次執行裡
     就再也不會命中任何檔案,而且看起來像是全部通過。 */
  if (list.length) aliasCache = { root, list }

  return list
}

// --- 讀 tailwind 的 theme 設定 ----------------------------------------------
//
// 規則要知道兩件事:這個專案的 theme 整組覆寫了哪幾類、各類實際定義了哪些值。
// 那份資料只有設定檔知道,所以直接讀它 —— 在別處抄一份就要人工同步,
// 而忘了同步不會報錯,只會讓規則開始講錯話。
//
// 設定檔是 ESM,同步讀取解析不了,所以用括號配對取出區塊、再取第一層的 key。
// 只需要「有哪些名字」,不需要值,所以不必真的求值。

/** 樣式設定檔在哪(給「缺前提就說出來」的檢查用) */
export const styleConfigPathOf = (root) => firstExisting(root, STYLE_CONFIG_FILES)

/**
 * 從 `{` 開始配對到對應的 `}`,回傳中間的內容。
 *
 * 字串與樣板字面值裡的括號要跳過 —— 這個專案的斷點設定裡就有
 * `'\\0screen\\, screen\\9'` 這種內容,不跳過的話配對會從中間斷掉。
 */
const braceBodyOf = (text, start) => {
  let depth = 0
  let quote = null

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]

    if (quote) {
      if (ch === '\\') i += 1
      else if (ch === quote) quote = null
      continue
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch
      continue
    }

    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start + 1, i)
    }
  }

  return ''
}

/** 取某個名字後面那個物件的內容;`名字: {` 與 `名字= {` 都認得 */
export const objectBodyAfter = (text, name) => {
  const m = new RegExp(`\\b${name}\\s*[:=]\\s*\\{`).exec(text)
  if (!m) return null

  return braceBodyOf(text, m.index + m[0].length - 1)
}

/**
 * 一段物件內容裡第一層的 key。
 *
 * 巢狀物件、陣列、字串裡的內容都要跳過 —— `screens` 底下每個斷點自己
 * 又是一個物件,不跳過的話 `raw` `min` `max` 會被當成斷點名。
 */
export const topLevelKeysOf = (body) => {
  const keys = []
  let depth = 0
  let quote = null
  let token = ''

  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i]

    if (quote) {
      if (ch === '\\') i += 1
      else if (ch === quote) quote = null
      continue
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      // 引號包起來的 key(例如 'default-light')也要收
      if (depth === 0) token = ''
      quote = ch

      if (depth === 0) {
        const end = body.indexOf(ch, i + 1)
        if (end !== -1 && /^\s*:/.test(body.slice(end + 1))) keys.push(body.slice(i + 1, end))
      }
      continue
    }

    if (ch === '{' || ch === '[' || ch === '(') depth += 1
    else if (ch === '}' || ch === ']' || ch === ')') depth -= 1
    else if (depth === 0) {
      if (ch === ':') {
        const name = token.trim()
        if (/^[\w-]+$/.test(name)) keys.push(name)
        token = ''
      } else if (ch === ',') {
        /* 逗號收尾代表這是簡寫(`boxShadow,` —— 值從別的檔案 import 進來)。
           名字本身就是 key,所以照樣收;值在哪裡由呼叫端自己追。 */
        const name = token.trim()
        if (/^[\w-]+$/.test(name)) keys.push(name)
        token = ''
      } else {
        token += ch
      }
    }
  }

  return keys
}

let themeCache = null

/**
 * 這個專案的 tailwind theme 整組覆寫了哪幾類、各類有哪些值。
 *
 * 回傳 `{ 類別名: [值, …] }`。只看 `theme` 直接底下的 ——
 * 寫在 `extend` 底下的是「補充」,內建值都還在,不算整組覆寫。
 *
 * 值寫成簡寫(`boxShadow,`,從另一支檔案 import 進來)時會追到那支檔案,
 * 找 `export const boxShadow = { … }` 取它的 key。
 *
 * 讀不到設定檔就回空物件 —— 依賴它的規則會自己跳過,不誤報。
 */
export const tailwindThemeOf = (root) => {
  if (themeCache?.root === root) return themeCache.theme

  const file = styleConfigPathOf(root)
  const theme = {}

  if (!file) return theme

  try {
    const text = fs.readFileSync(file, 'utf8')
    const themeBody = objectBodyAfter(text, 'theme')

    if (themeBody === null) return theme

    // extend 底下是補充,不是整組覆寫 —— 整段挖掉再看剩下的
    const extendBody = objectBodyAfter(themeBody, 'extend')
    const overrideBody = extendBody === null ? themeBody : themeBody.replace(extendBody, '')

    for (const group of topLevelKeysOf(overrideBody)) {
      if (group === 'extend') continue

      const body = objectBodyAfter(overrideBody, group)

      if (body !== null) {
        theme[group] = topLevelKeysOf(body)
        continue
      }

      /* 簡寫:值從別的檔案 import 進來。找那支檔案裡的 `export const 名字 = {…}`。
         追不到就記成空陣列 —— 那一類確實被覆寫了(規則要照樣提醒內建值消失),
         只是列不出可用的值。 */
      theme[group] = importedObjectKeysOf(root, file, text, group)
    }
  } catch {
    // 讀不到就讓依賴它的規則自己跳過,不要因此讓整支工具失效
  }

  themeCache = { root, theme }

  return theme
}

/** 追 import 來源檔案裡的 `export const 名字 = { … }`,取第一層 key */
const importedObjectKeysOf = (root, configFile, configText, name) => {
  const m = new RegExp(
    `import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`
  ).exec(configText)

  if (!m) return []

  const spec = m[1]
  if (!spec.startsWith('.')) return [] // 套件裡的,不是這個專案定義的

  const target = path.resolve(path.dirname(configFile), spec)

  for (const candidate of [target, `${target}.js`, `${target}.mjs`, `${target}.ts`]) {
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) continue

    try {
      const body = objectBodyAfter(fs.readFileSync(candidate, 'utf8'), name)
      if (body !== null) return topLevelKeysOf(body)
    } catch {
      // 讀不到就當作列不出可用的值
    }
  }

  return []
}

const IMPORT_RE =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g

const checkImportAlias = ({ rel, text, root }) => {
  if (!isSourceFile(rel)) return []

  const aliases = buildAliasMap(root)
  const dir = path.dirname(path.resolve(root, rel))

  const issues = []
  const seen = new Set()

  for (const m of text.matchAll(IMPORT_RE)) {
    const spec = m[1] || m[2] || m[3]

    if (!spec || spec[0] !== '.') continue // 只看相對路徑
    if (!spec.includes('..')) continue // 同層 ./ 是正常寫法
    if (seen.has(spec)) continue

    const target = path.resolve(dir, spec)
    const hit = aliases.find((a) => target === a.root || target.startsWith(a.root + path.sep))
    if (!hit) continue

    seen.add(spec)

    const rest = path.relative(hit.root, target).split(path.sep).join('/')
    const suggestion = rest ? `${hit.alias}/${rest}` : hit.alias

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'importAlias',
        `'${spec}' 要改成 '${suggestion}' —— 離開自己資料夾的相對路徑改用 alias,搬檔案時才不必重算層數`
      )
    )
  }

  return issues
}

// --- 規則 deprecated:已淘汰的寫法 -------------------------------------------

const checkDeprecated = ({ rel, text }) => {
  if (!isSourceFile(rel)) return []

  const issues = []
  const inActions = isActionsFile(rel)

  text.split(/\r?\n/).forEach((line, i) => {
    if (isCommentLine(line)) return

    // apiParams 已淘汰 —— 動態網址一律用 {key} 模板
    if (/\bapiParams\s*:/.test(line) || /\.apiParams\b/.test(line)) {
      issues.push(
        issueOf(
          rel,
          i + 1,
          'deprecated',
          `apiParams 已淘汰 —— 動態網址用 {key} 模板(例如 'member/voucher/{id}'),呼叫端傳扁平物件 { id }`
        )
      )
    }

    // route / router 一律用 useRoute() / useRouter()
    if (/\binject\s*\(\s*['"]rout(?:e|er)['"]\s*\)/.test(line)) {
      issues.push(
        issueOf(rel, i + 1, 'deprecated', `inject('route' / 'router') 已淘汰 —— 改用 useRoute() / useRouter()`)
      )
    }

    if (!inActions) return

    // actions 不留 console.log
    if (/\bconsole\.log\s*\(/.test(line)) {
      issues.push(issueOf(rel, i + 1, 'deprecated', 'actions 內不保留 console.log'))
    }

    // bare 透傳:return await apiXxx()
    if (/\breturn\s+await\s+api\w*\s*\(/.test(line)) {
      issues.push(
        issueOf(
          rel,
          i + 1,
          'deprecated',
          `不要 bare 透傳 —— 改成 const { config, status, data } = await apiXxx();(非 200 走錯誤處理)…… return { config, status, data }`
        )
      )
    }
  })

  return issues
}

// --- composableOrder:store / actions 的宣告順序 -----------------------------
//
// 順序(每一項都是 Store 在前、Actions 在後;專案沒有的那幾項自然略過):
//
//   1 common       全站共用
//   2 project      專案層級
//   3 nav          導覽
//   4 member       會員
//   5 自己頁面      這支檔案所屬的頁面資料夾對應的那一支
//   6 其他頁面      其餘各頁面,彼此不限先後
//   7 json          靜態文案資料
//   8 lineLiff      外部平台整合
//   9 popup         彈窗
//
// 這條**不報違規,存檔時直接排好**。順序是機械式的規則,
// 讓人照著訊息一行一行搬只是浪費時間,而且搬的過程比工具更容易出錯。
//
// 兩個宣告之間若夾了別的語句(storeToRefs / computed / ref …),那是「屏障」——
//    屏障前後各自為獨立區塊,**不跨屏障搬移**。那些語句往往相依於前面的宣告,
//    跨過去會造成 TDZ(用到還沒初始化的變數),程式直接壞掉。

/**
 * 分類名稱對照順位。認的是 `use` 與 `Store` / `Actions` 之間那一段。
 *
 * 外部平台整合那一項有兩種常見寫法 —— `useLiffStore` 與 `useLineLiffStore`,
 * 兩種都認、都排在第 8 位。只認其中一種的話,另一種寫法會被當成「其他頁面」
 * 排到第 6 位,而這條是自動改檔、不報違規的,排錯了不會有人收到訊息。
 */
const RANK = {
  Common: 1,
  Project: 2,
  Nav: 3,
  Member: 4,
  Json: 7,
  Liff: 8,
  LineLiff: 8,
  Popup: 9,
}

/** 這支檔案自己所屬的頁面 */
const OWN_PAGE_RANK = 5

/** 其他頁面 —— 彼此不限先後 */
const OTHER_PAGE_RANK = 6

/**
 * 從檔案路徑推出「這支檔案屬於哪一個頁面」。
 *
 * 頁面目錄底下的第一層資料夾就是頁面名稱;不在頁面目錄底下(共用元件那些)
 * 回傳 null,那時沒有「自己頁面」,所有頁面 store 都算其他頁面。
 */
const ownPageOf = (rel) => {
  if (!rel.startsWith(`${VIEWS_DIR}/`)) return null

  const [folder] = rel.slice(VIEWS_DIR.length + 1).split('/')
  return folder || null
}

/**
 * [主序, 次序] —— 同一項裡 Store=0 / Actions=1;頁面類一律 0(彼此不限序)。
 *
 * member 有兩種身分:在別的頁面時它是固定的第 4 項,
 * 在 member 自己的頁面裡它就是「自己頁面」(第 5 項)。
 */
const rankOf = (name, ownPage) => {
  const isOwnPage = ownPage && name.toLowerCase() === ownPage.toLowerCase()
  return isOwnPage ? OWN_PAGE_RANK : (RANK[name] ?? OTHER_PAGE_RANK)
}

/* route 與 router 排在所有 store 分類之後,兩者之間 route 在前。
   它們不是 store,但同樣是「取得東西的宣告」,一起排才不會散在中間。 */
const ROUTE_RANK = 10
const ROUTER_RANK = 11

/**
 * 同一個分類裡面的順序:
 *
 *   0  const x = useXxxStore()
 *   1  const { a } = storeToRefs(x)
 *   2  const { onB } = useXxxActions()
 *
 * storeToRefs 依賴它上面那一行的 store,所以永遠排在自己那一支 store 之後。
 */
const ROLE_STORE = 0
const ROLE_STORE_TO_REFS = 1
const ROLE_ACTIONS = 2

const STORE_RE = /=\s*use([A-Z][A-Za-z0-9]*?)Store\s*\(/
const ACTIONS_RE = /=\s*use([A-Z][A-Za-z0-9]*?)Actions\s*\(/
const STORE_TO_REFS_RE = /=\s*storeToRefs\s*\(\s*([\w.]+)\s*\)/
const ROUTE_RE = /=\s*useRoute\s*\(/
const ROUTER_RE = /=\s*useRouter\s*\(/

/** 這一行有沒有宣告出一個變數名(storeToRefs 要靠它回頭找是哪一支 store) */
const DECL_NAME_RE = /^\s*(?:const|let|var)\s+(\w+)\s*=/

const DECL_START_RE = /^\s*(?:const|let|var)\b/
const COMMENT_LINE_RE = /^\s*(?:\/\/|\/\*|\*)/

/**
 * 只有空行與註解不算屏障。
 *
 * 除此之外的每一種語句都是屏障 —— `ref()`、`computed()`、一般的函式呼叫都算,
 * 排序不會跨過它們。這些語句往往用到前面剛宣告的東西
 * (例如 `const total = computed(() => list.value.length)` 用到 `list`),
 * 把後面的宣告搬到它前面,程式就會用到還沒初始化的變數而直接壞掉。
 *
 * 這條是自動改檔、不報違規的功能 —— 排錯了沒有人會收到訊息,
 * 所以寧可少排幾行,也不放行任何有可能改壞程式的搬移。
 */
const isIgnorableLine = (line) => /^\s*$/.test(line) || COMMENT_LINE_RE.test(line)

/** 從 anchor 行往回找宣告起始行 */
const findDeclStart = (lines, anchorIdx) => {
  for (let i = anchorIdx; i >= 0; i -= 1) {
    if (DECL_START_RE.test(lines[i])) return i
    // 解構的續行才繼續往回;遇到獨立語句就停
    if (i < anchorIdx && /[;}]\s*$/.test(lines[i]) && !/^\s*[\w,{}\s:]+$/.test(lines[i])) break
  }

  return anchorIdx
}

/**
 * 宣告往上收攏緊鄰的註解 —— 那些註解在說明的就是下面那一行,
 * 搬動時不帶著走,註解就會變成在描述別人。
 *
 * 中間有空行就停:隔了一行的註解通常是在講整段,不是專屬某一個宣告。
 */
const withLeadingComments = (lines, declStart) => {
  let start = declStart

  while (start > 0 && COMMENT_LINE_RE.test(lines[start - 1])) start -= 1

  return start
}

/**
 * 解析 `<script setup>` 裡的 store / actions 宣告。
 *
 * 每一筆記下:含註解的起訖行、排序用的順位、名稱。
 * 找不到 `<script setup>` 或宣告不到兩個就回 null(沒有東西要排)。
 */
const parseComposableDecls = (rel, text) => {
  const m = /<script\b[^>]*\bsetup\b[^>]*>([\s\S]*?)<\/script>/i.exec(text)
  if (!m) return null

  const lines = m[1].split('\n')
  const ownPage = ownPageOf(rel)

  /* 先記下「哪個變數名是哪一支 store」——
     storeToRefs(common) 要靠這張表才知道自己屬於 common 那一組。 */
  const storeVars = new Map()

  lines.forEach((line) => {
    const store = STORE_RE.exec(line)
    const declName = DECL_NAME_RE.exec(line)
    if (store && declName) storeVars.set(declName[1], store[1])
  })

  const decls = []

  lines.forEach((line, i) => {
    if (COMMENT_LINE_RE.test(line)) return

    /* 一行能歸到哪一組、在組內排第幾 —— 認不出來就不是可排序的宣告,
       那一行會變成屏障(下面 groupByBarrier 判斷)。

       三個變數刻意不給初值:下面每一條分支都會把三個都填滿,
       填不滿的那條直接 return。給了初值反而讓「漏填一條分支」變成
       安靜地用預設值排序,而不是當場壞掉。 */
    let rank
    let role
    let label

    const store = STORE_RE.exec(line)
    const actions = ACTIONS_RE.exec(line)
    const toRefs = STORE_TO_REFS_RE.exec(line)

    if (store) {
      rank = rankOf(store[1], ownPage)
      role = ROLE_STORE
      label = `use${store[1]}Store`
    } else if (actions) {
      rank = rankOf(actions[1], ownPage)
      role = ROLE_ACTIONS
      label = `use${actions[1]}Actions`
    } else if (toRefs) {
      // 取變數名的第一段:storeToRefs(member) 與 storeToRefs(member.info) 都歸 member
      const [varName] = toRefs[1].split('.')
      const owner = storeVars.get(varName)

      // 找不到對應的 store(可能是別處傳進來的)就不排它,當屏障處理
      if (!owner) return

      rank = rankOf(owner, ownPage)
      role = ROLE_STORE_TO_REFS
      label = `storeToRefs(${varName})`
    } else if (ROUTE_RE.test(line)) {
      rank = ROUTE_RANK
      role = ROLE_STORE
      label = 'useRoute'
    } else if (ROUTER_RE.test(line)) {
      rank = ROUTER_RANK
      role = ROLE_STORE
      label = 'useRouter'
    } else {
      return
    }

    const declStart = findDeclStart(lines, i)

    decls.push({
      start: withLeadingComments(lines, declStart),
      declStart,
      end: i,
      tuple: [rank, role],
      label,
    })
  })

  if (decls.length < 2) return null

  return { lines, decls, bodyStart: m.index + m[0].indexOf('>') + 1, match: m }
}

/**
 * 把相鄰、中間沒有屏障的宣告分成一組一組。
 *
 * 屏障 = 兩個宣告之間夾了別的語句(storeToRefs / computed / ref …)。
 * 那些語句常常相依於前面的宣告,跨過去搬會造成用到還沒初始化的變數。
 * 所以**只在同一組內排序**,組與組之間完全不動。
 */
const groupByBarrier = (lines, decls) => {
  const groups = [[decls[0]]]

  for (let k = 1; k < decls.length; k += 1) {
    const prev = decls[k - 1]
    const curr = decls[k]

    let barrier = false
    for (let ln = prev.end + 1; ln < curr.start; ln += 1) {
      if (!isIgnorableLine(lines[ln])) {
        barrier = true
        break
      }
    }

    if (barrier) groups.push([curr])
    else groups[groups.length - 1].push(curr)
  }

  return groups
}

/**
 * 依規範把 store / actions 的宣告排好,回傳整份新的檔案內容。
 *
 * 沒有需要調整時回傳 null —— 呼叫端據此決定要不要寫檔。
 *
 * 這個函式會直接改動程式碼。安全前提有三個,少一個就可能改壞:
 *      1. 只在同一個屏障區塊內重排,組與組之間不動
 *      2. 每一筆帶著自己上方緊鄰的註解一起搬
 *      3. 排序是穩定的 —— 順位相同的兩筆維持原本的先後
 */
export const onSortComposables = (text, rel) => {
  if (!isInSrc(rel) || !rel.endsWith('.vue')) return null

  const parsed = parseComposableDecls(rel, text)
  if (!parsed) return null

  const { lines, decls, match } = parsed
  const groups = groupByBarrier(lines, decls)

  /* 每一組各自排序,並讓組內的宣告連續 —— 中間的空行拿掉。
     一組就是「順序有意義的一整串」,中間空一行會讓人以為那是兩段不同的東西,
     而排序完之後那個空行還會停在原地,夾在不相干的兩筆之間。

     由後往前處理:前面的組先不動,行號才不會因為後面刪了空行而位移。 */
  const nextLines = [...lines]
  let changed = false

  for (const group of [...groups].reverse()) {
    if (group.length < 2) continue

    const sorted = [...group].sort((a, b) => {
      const [ar, as] = a.tuple
      const [br, bs] = b.tuple
      return ar - br || as - bs || group.indexOf(a) - group.indexOf(b)
    })

    /* 組內兩筆之間夾的東西:全部是空行就拿掉,有註解就整段留著。
       那種註解多半在講後面一整段,刪掉就是資料遺失 —— 而這個函式
       不報違規、直接改檔,刪錯了不會有人收到訊息。 */
    const gaps = []
    for (let k = 1; k < group.length; k += 1) {
      const between = lines.slice(group[k - 1].end + 1, group[k].start)
      gaps.push(between.every((l) => /^\s*$/.test(l)) ? [] : between)
    }

    const hasBlankGap = gaps.some((g, i) => g.length === 0 && group[i].end + 1 < group[i + 1].start)
    const isSorted = sorted.every((d, i) => d === group[i])

    if (isSorted && !hasBlankGap) continue

    /* 重建整組:排序後的宣告依序接起來,中間只保留「夾著註解」的那幾段。
       註解段落跟著它原本的位置(第幾個間隔),不跟著被搬動的宣告走 ——
       那段文字講的是「這個位置之後」的事,搬走會讓它指向錯的東西。 */
    const rebuilt = []
    sorted.forEach((d, i) => {
      rebuilt.push(...lines.slice(d.start, d.end + 1))
      if (i < gaps.length) rebuilt.push(...gaps[i])
    })

    const from = group[0].start
    const to = group[group.length - 1].end

    // 內容行數不可以變多 —— 變多代表解析有落差,寧可不動
    if (rebuilt.length > to - from + 1) continue

    nextLines.splice(from, to - from + 1, ...rebuilt)
    changed = true
  }

  if (!changed) return null

  const nextBody = nextLines.join('\n')
  const before = text.slice(0, match.index)
  const after = text.slice(match.index + match[0].length)
  const rebuilt = match[0].replace(match[1], nextBody)

  return `${before}${rebuilt}${after}`
}

// --- 規則 importOrder:元件的 import 怎麼寫 ----------------------------------
//
// **只管共用元件目錄底下的 .vue。** 頁面不在範圍內 —— 頁面載入的東西
// 依它要做的事而定,沒有固定的形狀;元件是被重複放進畫面的零件,
// 每一支長得一樣才好接手。
//
// 管兩件事,而兩件事的處理方式不同:
//
//   一、樣式一定要 import —— 報違規
//      元件的樣式寫在 CSS 模組裡,由元件自己載入。少了那一行,
//      這支元件在別的頁面被用到時樣式不會跟著來 —— 而它在原本那一頁看起來
//      是正常的(因為同一頁的別支元件已經把樣式載進來了)。
//      那種問題要換一頁才發現,而且看起來像是「這一頁壞了」。
//      這一條只能報:工具看不出這支元件的樣式該放在哪一支 CSS 模組,
//      自動補一行等於替開發者決定檔案要叫什麼。
//
//   二、import 依分組排列 —— 存檔時直接排好,不報違規
//      一支檔案開頭那十幾行,每個人寫的順序都不一樣的話,
//      要找「這支有沒有載入某個東西」得整段看完。
//      順序是機械式的規則,讓人照著訊息一行一行搬只是浪費時間,
//      而且搬的過程比工具更容易出錯。自動排序的行為在 onSortImports。
//
// 分組與順序定義在 project-config.mjs 的 IMPORT_ORDER_GROUPS ——
// 各專案的 alias 與資料夾命名不同,寫死在這裡的話,換一個命名的專案
// 會把每一支元件都報成順序錯。
//
// **只管組與組之間的先後,不管同一組裡面怎麼排。** 組內另有規則
// (樣式那一組的變數檔要排在版型檔之前,那是 moduleOrder 在管)——
// 兩條都去管組內順序的話,同一行會被指出兩種不同的修法。

/**
 * 這一行 import 屬於哪一組;都不符合就回組數(也就是排在最後的「其他」)。
 *
 * 對外提供是為了讓規則的自我驗證能確認「造出來的探針真的落在預期那一組」——
 * 分組來自設定,驗證自己算一次的話就成了第二份判準,兩邊會有對不上的一天。
 */
export const importGroupOf = (spec) => {
  const hit = IMPORT_ORDER_GROUPS.findIndex((g) => new RegExp(g.match).test(spec))
  return hit === -1 ? IMPORT_ORDER_GROUPS.length : hit
}

/** import 的路徑與行號 —— 具名、整包、純副作用(只寫路徑)三種都要認 */
const IMPORT_SPEC_RE = /^import\s+(?:[^'"\n]*?from\s*)?['"]([^'"]+)['"]/gm

/** 樣式是第一組 —— 「一定要有」檢查的就是這一組有沒有出現 */
const STYLE_GROUP = 0

const checkImportOrder = ({ rel, text }) => {
  if (!rel.startsWith(`${COMPONENTS_DIR}/`) || !rel.endsWith('.vue')) return []

  const hasStyle = [...text.matchAll(IMPORT_SPEC_RE)].some(
    (m) => importGroupOf(m[1]) === STYLE_GROUP
  )
  if (hasStyle) return []

  return [
    issueOf(
      rel,
      1,
      'importOrder',
      `這支元件沒有載入樣式 —— 元件的樣式寫在 CSS 模組裡、由元件自己 import;少了那一行,這支元件被放進別的頁面時樣式不會跟著來,而在原本那一頁看起來是正常的`
    ),
  ]
}

/** 單行寫完的 import —— 路徑與 import 在同一行才認得出來 */
const IMPORT_LINE_RE = /^import\s+(?:[^'"]*?from\s*)?['"]([^'"]+)['"]/

/**
 * 把元件的 import 依分組排好,回傳整份新的檔案內容。
 *
 * 沒有需要調整時回傳 null —— 呼叫端據此決定要不要寫檔。
 *
 * 這個函式會直接改動程式碼。安全前提有三個,少一個就可能改壞:
 *      1. 只在「連續好幾行都是 import」的區塊內重排,跨過任何一行別的東西就停
 *      2. 每一行帶著自己上方緊鄰的註解一起搬
 *      3. 排序是穩定的 —— 同一組的兩行維持原本的先後,組內順序另有規則在管
 *
 * 分好幾行寫的 import(路徑不在 import 那一行上)認不出來,
 * 那種區塊整塊不動 —— 排錯一行的代價遠高於少排一次。
 */
export const onSortImports = (text, rel) => {
  if (!rel.startsWith(`${COMPONENTS_DIR}/`) || !rel.endsWith('.vue')) return null

  const lines = text.split('\n')
  const nextLines = [...lines]
  let changed = false

  /** 一個區塊排好之後寫回去;區塊之間互不影響 */
  const flush = (items, from, to) => {
    if (items.length < 2) return

    const sorted = [...items].sort((a, b) => a.group - b.group || items.indexOf(a) - items.indexOf(b))
    if (sorted.every((item, i) => item === items[i])) return

    const rebuilt = sorted.flatMap((item) => lines.slice(item.start, item.end + 1))

    // 行數不可以變 —— 變了代表解析有落差,寧可不動
    if (rebuilt.length !== to - from + 1) return

    nextLines.splice(from, rebuilt.length, ...rebuilt)
    changed = true
  }

  let items = []
  let pending = []
  let from = -1

  lines.forEach((line, i) => {
    if (COMMENT_LINE_RE.test(line)) {
      pending.push(i)
      return
    }

    const hit = IMPORT_LINE_RE.exec(line)
    if (hit) {
      const start = pending.length ? pending[0] : i
      if (from === -1) from = start
      items.push({ group: importGroupOf(hit[1]), start, end: i })
      pending = []
      return
    }

    if (items.length) flush(items, from, items[items.length - 1].end)
    items = []
    pending = []
    from = -1
  })

  if (items.length) flush(items, from, items[items.length - 1].end)

  return changed ? nextLines.join('\n') : null
}

export const CODE_CHECKS = [checkImportAlias, checkDeprecated, checkImportOrder]

/* composableOrder 沒有出現在這兩張表裡 —— 它不報違規,存檔時直接把順序排好。
   自動修正的行為在 onSortComposables。 */

export const CODE_RULE_TITLE = {
  importOrder: '元件沒有載入樣式',
  importAlias: 'import 沒有使用 alias',
  deprecated: '已淘汰的寫法',
}

export const CODE_RULE_HINT = {
  importOrder: '元件的樣式寫在 CSS 模組裡,由元件自己 import(分組順序存檔時自動排好)',
  importAlias: '離開自己資料夾的相對路徑改用 @ alias',
  deprecated: 'apiParams / inject(route) 已淘汰;actions 不留 console.log、不 bare 透傳',
}
