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
  FORM_GROUP_VALIDATOR,
  IMPORT_ORDER_GROUPS,
  IS_FILE_BASED_ROUTING,
  PROJECT_CONFIG_FILES,
  STYLE_CONFIG_FILES,
  VIEW_UNDERSCORE_FOLDERS,
  CSS_MODULES_DIR,
  COMPONENT_DIRS,
  STORE_DIR,
  classPrefixOf,
  componentClassOf,
  listFiles,
  storeIndexOf,
  transitionNamesInCss,
  transitionStyleIndexOf,
  selectorClassesOf,
  isInActionsDir,
  isInSrc,
  VIEWS_DIR,
  issueOf,
  lineNoOf,
  IMPORT_RE,
  maskComments,
  maskHtmlComments,
  templateRangeOf,
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
// 為什麼:`../../../<別的資料夾>/x.js` 這種路徑,搬動檔案時要一層層重算,
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
export const topLevelKeysOf = (rawBody) => {
  /* 註解先遮掉 —— 裡面的大括號、冒號、引號會把下面這個狀態機帶偏,
     而帶偏的結果是「一個 key 都認不出來」,不是報錯。
     設定檔裡本來就會寫註解說明每一組值是什麼,不處理的話,
     寫了註解的專案整份設定就讀成空的,而依賴它的規則從此不報任何東西。

     兩種註解都要遮:設定檔是 JS,區塊註解與 `//` 行註解都會出現。
     副檔名固定給 .js —— 這個函式拿到的是一段物件內容,不是整支檔案。 */
  const body = maskComments('.js', rawBody)

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
    const found = themeBodyOf(root, file, text)

    if (found === null) return theme

    Object.assign(theme, overridesIn(root, found.file, found.text, found.body))
  } catch {
    // 讀不到就讓依賴它的規則自己跳過,不要因此讓整支工具失效
  }

  themeCache = { root, theme }

  return theme
}

/**
 * theme 的物件本體在哪 —— 可能就寫在設定檔裡,也可能拆到另一支再 import 進來。
 *
 * 回傳 `{ body, file, text }`:body 是那個物件的內容,file 與 text 是它所在的
 * 那一支檔案(theme 底下某一類又是從第三支 import 進來時,要從**它**的位置去追)。
 *
 * **拆出去是常見的擺法**(tailwind.theme.js 就是為此存在)。
 * 只認寫在設定檔裡那一種的話,拆過的專案會讀成空的 ——
 * 而讀成空的不會報錯,只是「用到已經消失的 class」那條規則從此不報任何東西。
 */
const themeBodyOf = (root, file, text) => {
  const inline = objectBodyAfter(text, 'theme')
  if (inline !== null) return { body: inline, file, text }

  /* 不是物件字面值,那就是個名字:`theme,`(簡寫)或 `theme: 別的名字`。
     取那個名字,再去找它從哪一支檔案 import 進來。 */
  const named = /\btheme\s*:\s*([A-Za-z_$][\w$]*)/.exec(text)
  const name = named ? named[1] : /\btheme\s*,/.test(text) ? 'theme' : null

  if (!name) return null

  const spec = importSpecOf(text, name)
  if (!spec) return null

  for (const candidate of resolveCandidates(file, spec)) {
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) continue

    try {
      const sub = fs.readFileSync(candidate, 'utf8')
      /* 那一支可能寫成 `export default { … }`,也可能是
         `export const theme = { … }` 再 default 出去 —— 兩種都要認。 */
      const body = braceBodyAfterDefault(sub) ?? objectBodyAfter(sub, name)

      if (body !== null) return { body, file: candidate, text: sub }
    } catch {
      // 讀不到就當作追不到,交給呼叫端回空的
    }
  }

  return null
}

/** `export default {` 後面那個物件的內容 */
const braceBodyAfterDefault = (text) => {
  const m = /export\s+default\s*\{/.exec(text)

  return m ? braceBodyOf(text, m.index + m[0].length - 1) : null
}

/** 這個名字是從哪一支檔案 import 進來的 —— 預設匯入與具名匯入都認 */
const importSpecOf = (text, name) => {
  const def = new RegExp(`import\\s+${name}\\s+from\\s*['"]([^'"]+)['"]`).exec(text)
  if (def) return def[1]

  const named = new RegExp(
    `import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`
  ).exec(text)

  return named ? named[1] : null
}

/** 相對路徑要補副檔名才找得到檔案 */
const resolveCandidates = (fromFile, spec) => {
  if (!spec.startsWith('.')) return [] // 套件裡的,不是這個專案定義的

  const target = path.resolve(path.dirname(fromFile), spec)

  return [target, `${target}.js`, `${target}.mjs`, `${target}.ts`]
}

/**
 * 一段 theme 本體裡,哪幾類是「整組覆寫」、各類有哪些值。
 *
 * extend 底下的是補充(內建值都還在),不算覆寫,所以整段挖掉再看剩下的。
 */
const overridesIn = (root, file, text, themeBody) => {
  const out = {}
  const extendBody = objectBodyAfter(themeBody, 'extend')
  const overrideBody = extendBody === null ? themeBody : themeBody.replace(extendBody, '')

  for (const group of topLevelKeysOf(overrideBody)) {
    if (group === 'extend') continue

    const body = objectBodyAfter(overrideBody, group)

    if (body !== null) {
      out[group] = topLevelKeysOf(body)
      continue
    }

    /* 簡寫:值從別的檔案 import 進來。找那支檔案裡的 `export const 名字 = {…}`。
       追不到就記成空陣列 —— 那一類確實被覆寫了(規則要照樣提醒內建值消失),
       只是列不出可用的值。 */
    out[group] = importedObjectKeysOf(root, file, text, group)
  }

  return out
}

/** 追 import 來源檔案裡的 `export const 名字 = { … }`,取第一層 key */
const importedObjectKeysOf = (root, configFile, configText, name) => {
  const m = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`).exec(
    configText
  )

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

/**
 * 建置工具的「一次收一整批檔案」那種呼叫。
 *
 * 它吃的也是路徑,但寫法與 import 語句不同(一次可以給好幾條),
 * 所以另外抓 —— 只看 import 語句的話,這種路徑完全不會被檢查。
 *
 * 第二個參數那個設定物件裡的字串(`'default'` 這種)會一起被取出來,
 * 但它們不是相對路徑,下面那道「開頭是不是點」就會濾掉。
 */
const GLOB_CALL_RE = /import\.meta\.glob\s*\(([\s\S]*?)\)/g
const GLOB_PATH_RE = /['"]([^'"]+)['"]/g

/**
 * 這份檔案裡每一個寫出路徑的位置。
 *
 * import 語句與那種一次收一批的呼叫都算 —— 兩者都會因為檔案搬家而失效,
 * 而後者失效時**不會報錯**:收到的是空的一批,用它的地方靜靜地拿不到東西。
 */
const pathSpecsOf = (text) => {
  const specs = []

  for (const m of text.matchAll(IMPORT_RE)) {
    specs.push({ spec: m[1] || m[2] || m[3], index: m.index })
  }

  for (const call of text.matchAll(GLOB_CALL_RE)) {
    for (const p of call[1].matchAll(GLOB_PATH_RE)) {
      specs.push({ spec: p[1], index: call.index + call[0].indexOf(p[0]) })
    }
  }

  return specs
}

const checkImportAlias = ({ rel, text, root }) => {
  if (!isSourceFile(rel)) return []

  const aliases = buildAliasMap(root)
  const dir = path.dirname(path.resolve(root, rel))

  const issues = []
  const seen = new Set()

  for (const { spec, index } of pathSpecsOf(text)) {
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
        lineNoOf(text, index),
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
        issueOf(
          rel,
          i + 1,
          'deprecated',
          `inject('route' / 'router') 已淘汰 —— 改用 useRoute() / useRouter()`
        )
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

/**
 * 這個專案的樣式裡,定義過哪些 class。
 *
 * 掃一次就記住 —— 這條規則是逐檔跑的,每一支元件都重掃一遍的話,
 * 一次全專案檢查會把所有 css 讀上幾十次。
 *
 * 「選擇器裡有哪些 class」的抽取與模組樣式那條共用同一份(selectorClassesOf),
 * 兩邊問的是同一件事的兩面:那邊問「這裡定義了誰」,這裡問「誰被定義過」。
 */
let styledCache = null

const styledClassesOf = (root) => {
  if (styledCache?.root === root) return styledCache.set

  const set = new Set()

  for (const dir of [...COMPONENT_DIRS, CSS_MODULES_DIR]) {
    for (const abs of listFiles(root, dir)) {
      if (!abs.endsWith('.css')) continue

      try {
        for (const { cls } of selectorClassesOf(fs.readFileSync(abs, 'utf8'))) set.add(cls)
      } catch {
        // 讀不到某一支就跳過,不要因此讓整條規則失效
      }
    }
  }

  styledCache = { root, set }

  return set
}

/**
 * 這支元件寫出來的 class,有沒有任何一個真的有樣式。
 *
 * 有兩種元件沒有樣式可以載入,而要求它們載一支的結果都一樣糟
 * (去 import 別人的樣式,或建一支空檔案):
 *
 *   轉手型      自己完全不寫 class,把設定往下傳給另一支元件
 *   只給掛勾    寫了 class,但那幾個名字全案都沒有對應的樣式 ——
 *               外觀完全由使用端傳進來,那幾個 class 只是掛載點
 *
 * 所以判準不是「有沒有寫 class」,是「寫出來的那幾個有沒有人在定義」。
 *
 * 動態綁定(`:class="setClass.main"`)不算 —— 那個值由使用端傳進來,
 * 樣式該由傳進來的那一方負責。被註解掉的那一段也不算,那是死程式碼。
 */
const hasStyledClass = (text, root) => {
  const tpl = templateRangeOf(text)
  if (!tpl) return false

  const styled = styledClassesOf(root)
  const body = maskHtmlComments(tpl.body)

  for (const m of body.matchAll(/\sclass\s*=\s*"([^"]*)"/g)) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls && styled.has(cls)) return true
    }
  }

  return false
}

// --- 規則 vueFileName:.vue 的檔名怎麼取 --------------------------------------
//
// 兩種檔案的命名方向相反,分辨的是「它是不是一個網址」:
//
//   元件   首字大寫(PascalCase)—— 它在別的畫面裡被當成一個標籤寫出來,
//          而標籤的慣例就是大寫開頭;檔名與標籤一致才找得到它在哪
//   頁面   首字小寫(camelCase)—— 它對應的是一個網址,不是標籤,
//          而網址一向是小寫的;與 store 檔名、api 函式的命名也是同一套
//
// 元件資料夾底下那支「就是這個元件」的檔案叫 `Index.vue`:自動注入會略過
// 那一層,所以使用端寫的是資料夾名本身。取名 `Main.vue` 的話,名字裡會多出
// 一段不帶資訊的字,而讀的人看不出資料夾裡哪一支才是這個元件。
//
// 頁面目錄底下,底線開頭的資料夾裡放的不是頁面(元件、片段那些),
// 所以那裡面的 .vue 照元件那一套命名。
//
// 頁面檔名還要再分一次,依這個專案的網址從哪裡來(設定 PROJECT_FRAMEWORK):
//
//   自己寫路由表   `path` 與檔名各寫各的 —— 檔名只是內部的名字,
//                  跟著專案的命名慣例走(駝峰),連字號與底線都不用
//   檔案系統路由   檔名**就是**網址的一段 —— 連字號是網址分隔字詞的寫法,
//                  要放行;要求改成駝峰等於要求改網址,既有的連結會失效
//
// 兩種專案的底線與連續大寫都擋:網址裡的大寫在有的伺服器上不分大小寫,
// 同一個畫面會有兩個網址進得去。

/** 元件資料夾的主檔;`Main.vue` 是該被改掉的那一種 */
const MAIN_FILE_NAME = 'Index.vue'
const LEGACY_MAIN_RE = /^main\.vue$/i

/**
 * 駝峰以外的寫法 —— 連字號、底線,或連續兩個以上的大寫。
 *
 * 只看首字大小寫的話,`m-form-input.vue`、`user_card.vue` 都會通過,
 * 而同一個專案裡三種分隔寫法並存時,搜尋、比對、複製一段過來都要先想「這支叫什麼」。
 *
 * 連續大寫也算(`APIList.vue`):自動注入把檔名原樣當成標籤的一部分,
 * 那一段讀起來斷不出詞。
 */
const NOT_CAMEL_RE = /[-_]|[A-Z]{2,}/

/**
 * 網址那一側的分隔方式 —— 連字號放行,底線與連續大寫照擋。
 *
 * 檔案系統路由的專案裡,頁面的檔名與資料夾**就是**網址的一段:
 * `actual-subscribe.vue` 對應 `/actual-subscribe`,而連字號正是網址
 * 分隔字詞的寫法。要求改成駝峰等於要求把網址改掉 —— 既有的連結會失效,
 * 搜尋引擎收錄的也會指到不存在的位置。
 *
 * 底線與連續大寫仍然擋:底線不是網址分隔字詞的慣例,而大寫在有的伺服器上
 * 不分大小寫 —— 同一個畫面會有兩個網址進得去。
 */
const ROUTE_NAME_RE = /_|[A-Z]{2,}/

/**
 * 一個名字(檔名或資料夾名)該用哪一套分隔方式。
 *
 * 問的是同一件事:**這一段是不是網址**。是的話跟著網址的寫法走,
 * 不是的話跟著專案內部的命名慣例走(駝峰)。頁面的檔名與頁面目錄的資料夾
 * 都拿這一份判斷 —— 兩邊各寫一次的話,總有一天只改到其中一邊。
 *
 * 自己寫路由表的專案沒有「是網址」這回事:`path` 與檔案位置各寫各的,
 * 名字只是專案內部的名字,所以一律駝峰。
 * 哪一種由設定的 PROJECT_FRAMEWORK 決定,規則不自己猜框架。
 */
const nameShapeReFor = (isRouteSegment) =>
  IS_FILE_BASED_ROUTING && isRouteSegment ? ROUTE_NAME_RE : NOT_CAMEL_RE

/** 底線開頭的資料夾 —— 不對應網址的那些(元件、片段) */
const isUnderscoreFolder = (rel) => /\/_[^/]+\//.test(rel)

const isComponentVue = (rel) =>
  rel.startsWith(`${COMPONENTS_DIR}/`) ||
  (rel.startsWith(`${VIEWS_DIR}/`) && isUnderscoreFolder(rel))

const isPageVue = (rel) => rel.startsWith(`${VIEWS_DIR}/`) && !isUnderscoreFolder(rel)

const checkVueFileName = ({ rel }) => {
  if (!rel.endsWith('.vue')) return []

  const base = path.basename(rel)
  const first = base[0]
  const report = (detail) => [issueOf(rel, 1, 'vueFileName', detail)]

  /* 首字大小寫看的是「它是標籤還是網址」,這一段看的是**分隔方式** ——
     兩種寫法混在同一個專案裡,搜尋與比對都要先想「這支到底叫什麼」。

     檔案系統路由的專案裡,頁面檔名就是網址的一段,那一套不適用:
     連字號放行(網址就是這樣分隔字詞的),底線與連續大寫仍然擋。 */
  if (
    (isComponentVue(rel) || isPageVue(rel)) &&
    nameShapeReFor(isPageVue(rel)).test(path.basename(rel, '.vue'))
  ) {
    return report(
      IS_FILE_BASED_ROUTING && isPageVue(rel)
        ? `頁面的檔名是網址的一段(${base})—— 不要用底線,也不要連續大寫;` +
            `網址用連字號分隔字詞,而大寫在有的伺服器上會讓同一個畫面有兩個網址進得去`
        : `.vue 的檔名要用駝峰(${base})—— 不要用連字號、底線,也不要連續大寫;` +
            `同一個專案裡好幾種分隔方式並存時,找一支檔案要先想它是哪一種寫法`
    )
  }

  if (isComponentVue(rel)) {
    if (LEGACY_MAIN_RE.test(base)) {
      return report(
        `元件資料夾的主檔要叫 ${MAIN_FILE_NAME} —— 自動注入會略過那一層,` +
          `使用端寫的是資料夾名本身;取名 Main 會讓那個名字多出一段不帶資訊的字`
      )
    }

    if (first !== first.toUpperCase()) {
      return report(
        `元件的檔名首字要大寫(${base} → ${first.toUpperCase()}${base.slice(1)})—— ` +
          `它在別的畫面裡是一個標籤,檔名與標籤一致才找得到它在哪`
      )
    }

    return []
  }

  if (isPageVue(rel) && first !== first.toLowerCase()) {
    return report(
      `頁面的檔名首字要小寫(${base} → ${first.toLowerCase()}${base.slice(1)})—— ` +
        `頁面對應的是一個網址,不是標籤;store 的檔名與層名也是這一套`
    )
  }

  return []
}

// --- 規則 viewFolder:頁面目錄的資料夾怎麼命名 --------------------------------
//
// 頁面目錄的資料夾**一律對應網址**,所以名字跟著網址走:首字小寫。
// 一個大寫開頭的資料夾在網址裡會變成一段大寫的路徑,與其他段落長得不一樣,
// 而且有的伺服器對大小寫的處理不同 —— 同一個畫面可能有兩個網址進得去。
//
// 分隔方式與同一層的 `.vue` 檔名同一套,由設定的 PROJECT_FRAMEWORK 決定:
// 自己寫路由表的專案用駝峰(資料夾只是專案內部的名字),檔案系統路由的專案
// 放行連字號(那一層就是網址的一段)。兩邊都擋底線與連續大寫。
// 資料夾寬、檔案嚴的話,同一個名字寫成資料夾就過、寫成檔案就報。
//
// 底線開頭的那種是例外:它不是一段網址,是「放在頁面旁邊、只給這一頁用的東西」。
// **它底下的層級也不是網址**,所以走到那一層就不再往下檢查 ——
// 那裡面放的是元件,歸元件那一套命名管(首字大寫)。
// **允許的名字列在設定裡(VIEW_UNDERSCORE_FOLDERS)** —— 開放自由命名的話,
// 那個例外會愈開愈大,而每一個都要讀的人自己猜它是不是網址的一部分。
//
// 點開頭的資料夾(`.composables` 那種)不受這條約束,那是另一套慣例。

/** 資料夾名的形狀:點開頭(另一套慣例)、底線開頭(例外清單)、其餘是網址的一段 */
const isDotFolder = (name) => name.startsWith('.')
const isUnderscoreName = (name) => name.startsWith('_')

const checkViewFolder = ({ rel }) => {
  if (!rel.startsWith(`${VIEWS_DIR}/`)) return []

  const folders = rel.slice(`${VIEWS_DIR}/`.length).split('/').slice(0, -1)

  for (const name of folders) {
    /* 走到不是網址的那一層就停 —— 它**底下**的層級也不是網址。
       只跳過這一段而繼續往下檢查的話,`_components/Edit/` 的 Edit
       會被當成網址的一段報首字大寫,而那個資料夾裡放的是大寫開頭的元件:
       照著改會變成「大寫的元件裝在小寫的分類資料夾裡」,
       與「底線資料夾裡照元件那一套命名」正好相反。 */
    if (isDotFolder(name)) return []

    if (isUnderscoreName(name)) {
      /* 清單留空代表這個專案不做這項檢查 —— 那時底線資料夾一律放行,
         不是一律報:留空的專案會被每一支檔案報一次。 */
      if (!VIEW_UNDERSCORE_FOLDERS.length) return []
      if (VIEW_UNDERSCORE_FOLDERS.includes(name)) return []

      return [
        issueOf(
          rel,
          1,
          'viewFolder',
          `頁面目錄底下只能有這幾個底線資料夾:${VIEW_UNDERSCORE_FOLDERS.join('、')} —— ` +
            `${name} 不在裡面;那一層不是網址的一段,要多一種用途得先決定它值不值得存在`
        ),
      ]
    }

    if (name[0] !== name[0].toLowerCase()) {
      return [
        issueOf(
          rel,
          1,
          'viewFolder',
          `頁面目錄的資料夾首字要小寫(${name} → ${name[0].toLowerCase()}${name.slice(1)})—— ` +
            `那一層是網址的一段,而網址一向是小寫的`
        ),
      ]
    }

    /* 分隔方式與同一層的 .vue 檔名同一套 —— 兩者都在回答「這一段是不是網址」。
       資料夾寬、檔案嚴的話,同一個名字寫成資料夾就過、寫成檔案就報。 */
    if (nameShapeReFor(true).test(name)) {
      return [
        issueOf(
          rel,
          1,
          'viewFolder',
          IS_FILE_BASED_ROUTING
            ? `頁面目錄的資料夾是網址的一段(${name})—— 不要用底線,也不要連續大寫;` +
                `網址用連字號分隔字詞,而大寫在有的伺服器上會讓同一個畫面有兩個網址進得去`
            : `頁面目錄的資料夾要用駝峰(${name})—— 不要用連字號、底線,也不要連續大寫;` +
                `路由表裡的 path 與資料夾各寫各的,資料夾只是專案內部的名字,` +
                `與同一層的 .vue 檔名同一套`
        ),
      ]
    }
  }

  return []
}

// --- 規則 formGroupValidate:一組控制項共用一個驗證 ---------------------------
//
// 一個 `v-for` 跑出來的控制項,如果名字裡沒有帶到迭代變數,那幾個就是**同一個欄位**
// 的幾個選項 —— 一題多選、一題單選的那種。名字裡帶了迭代變數(`name-${index}`)
// 的則是各自獨立的欄位,不在這條的範圍內。
//
// 同一組的每一個都自己帶驗證時,每一個都會各驗一次、各產生一則訊息,
// 而它們說的是同一件事(這一題還沒選)—— 畫面上那句話會重複好幾行。
//
// 做法是把驗證掛在包住整組的那一層(設定 FORM_GROUP_VALIDATOR),
// 那一層只顯示一次;各個控制項只負責選取與錯誤外觀(由包裝那層把狀態傳下去)。
//
// 判準不看元件叫什麼名字 —— 看的是「一個迴圈、一個共用的名字、每個都自己驗」
// 這個形狀,換一套表單元件仍然成立。

/** 元件標籤的開頭(大寫開頭才是元件,原生標籤不算) */
const COMPONENT_TAG_RE = /<([A-Z][A-Za-z0-9]*)\b/

/** `v-for="(a, b) in list"` / `v-for="a in list"` 的迭代變數 */
const vForVarsOf = (tag) => {
  const m = /v-for="\s*\(?([^)]*?)\)?\s+(?:in|of)\s/.exec(tag)
  if (!m) return null

  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 標籤上綁的 name 值(靜態或動態都取字面) */
const nameValueOf = (tag) => /\s:?name="([^"]*)"/.exec(tag)?.[1] ?? ''

const checkFormGroupValidate = ({ rel, text }) => {
  if (!FORM_GROUP_VALIDATOR || !rel.endsWith('.vue')) return []

  const range = templateRangeOf(text)
  if (!range) return []

  const body = maskHtmlComments(range.body)
  const issues = []

  for (const m of body.matchAll(/<[A-Z][A-Za-z0-9]*\b[^>]*>/g)) {
    const tag = m[0]
    if (!COMPONENT_TAG_RE.test(tag)) continue
    if (!/\s:?rules=/.test(tag)) continue

    const vars = vForVarsOf(tag)
    if (!vars) continue

    /* 名字裡帶了迭代變數 → 每一個都是獨立的欄位,各自驗證是對的 */
    const name = nameValueOf(tag)
    if (vars.some((v) => new RegExp(`\\b${v}\\b`).test(name))) continue

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, range.offset + m.index),
        'formGroupValidate',
        `這一組控制項各自帶了驗證 —— 它們共用同一個名字,每一個都會驗一次、` +
          `各顯示一則同樣的訊息;把驗證掛在包住整組的 ${FORM_GROUP_VALIDATOR} 上,` +
          `那一層只顯示一次,這裡只留選取與錯誤外觀`
      )
    )
  }

  return issues
}

// --- 規則 componentClass:資料夾名要對得上 template 的 class -------------------
//
// 資料夾 `mFigure` 對 `.m-figure`、`mSvgIcon` 對 `.m-svg-icon` ——
// **模組 css 的 class 前綴就是從資料夾名推出來的**(那一側由 moduleScope 在管)。
//
// 兩者對不上時,樣式那一側會推出一個沒有人在用的前綴:元件寫 `.m-no-date`、
// 資料夾推出 `.m-no-data`,於是寫進 css 的每一條都被報成「別的模組的 class」,
// 或者反過來 —— css 寫對了前綴,template 卻吃不到。
//
// **沒有樣式檔的元件更看不出來**:那時 moduleScope 連看的機會都沒有,
// 對不上這件事完全沒有訊息,要到有人替它建樣式檔的那一天才爆出來。
// 所以這一條看的是 template,不是 css。
//
// 只比對「第一個帶前綴的靜態 class」—— 那是這支元件自己的組件 class。
// 底下的子元素(`.m-figure-caption`)與別的模組(轉手傳進來的)不在這條的範圍內。

/* 範圍只有共用元件目錄。容器與版型那兩層是依頁面組起來的版面,
   沒有模組前綴可以對照,這條對它們無從判斷。 */
const checkComponentClass = ({ rel, text }) => {
  if (!rel.startsWith(`${COMPONENTS_DIR}/`) || !rel.endsWith('.vue')) return []

  const folder = path.basename(path.dirname(rel))
  const prefix = classPrefixOf(folder)
  if (!prefix) return [] // 名字不是這套命名裡的模組,推不出前綴就不猜

  const cls = componentClassOf(text)
  if (!cls) return [] // 自己不寫 class 的轉手型元件

  if (cls === prefix || cls.startsWith(`${prefix}-`)) return []

  return [
    issueOf(
      rel,
      1,
      'componentClass',
      `資料夾 ${folder} 推出的 class 是 .${prefix},template 寫的是 .${cls} —— ` +
        `模組 css 的前綴從資料夾名推,兩者對不上的話那支元件的樣式沒有人在看`
    ),
  ]
}

// --- 規則 componentFolder:元件要有自己的資料夾 -------------------------------
//
// 分類資料夾底下不要直接放 .vue —— 一支元件遲早會有樣式、composable、
// 拆出來的子元件,那時才建資料夾就要動到每一個使用端(自動注入的名稱跟著路徑走)。
//
// 分辨「分類層」與「元件層」的方式:元件層是**它自己就是一個元件**,
// 所以資料夾名是 `m` 開頭(mForm、mCard);分類層只是把性質相近的放在一起
// (common、platform),名字不帶那個前綴。
//
// 所以 `mCard/Photo.vue`、`mForm/Input.vue` 是正常的(同一個模組的好幾支),
// `platform/mCoin.vue` 才是這條要抓的 —— 它應該是 `platform/mCoin/Index.vue`。

const checkComponentFolder = ({ rel }) => {
  if (!rel.startsWith(`${COMPONENTS_DIR}/`) || !rel.endsWith('.vue')) return []

  /* 路徑上任何一層是模組資料夾就放行 —— 一個模組底下再分子資料夾是正常的
     (把彈窗、面板各收成一疊)。只看上一層的話,那些子資料夾裡的檔案會被當成
     「放在分類資料夾底下」,而照著改是再包一層 Index.vue:名字沒變、位置更深,
     原本那個判斷仍然不成立,下一次照樣報。 */
  const folders = rel.slice(`${COMPONENTS_DIR}/`.length).split('/').slice(0, -1)
  if (folders.some((name) => classPrefixOf(name))) return []

  const base = path.basename(rel, '.vue')

  return [
    issueOf(
      rel,
      1,
      'componentFolder',
      `這支元件直接放在分類資料夾底下 —— 建一個自己的資料夾` +
        `(${base}/Index.vue),之後要加樣式、拆子元件時才不必動到每一個使用端`
    ),
  ]
}

const checkImportOrder = ({ rel, text, root }) => {
  if (!rel.startsWith(`${COMPONENTS_DIR}/`) || !rel.endsWith('.vue')) return []

  const hasStyle = [...text.matchAll(IMPORT_SPEC_RE)].some(
    (m) => importGroupOf(m[1]) === STYLE_GROUP
  )
  if (hasStyle) return []

  /* 沒有樣式可載的元件,這條的前提不成立 —— 兩種:自己完全不寫 class 的轉手型,
     以及寫了 class 但那幾個名字全案都沒有對應樣式的(外觀由使用端傳進來,
     那幾個 class 只是掛載點)。報它的話只有兩條路:去 import 別人的樣式,
     或建一支空的樣式檔,兩種都比違規本身更糟。 */
  if (!hasStyledClass(text, root)) return []

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

    const sorted = [...items].sort(
      (a, b) => a.group - b.group || items.indexOf(a) - items.indexOf(b)
    )
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

// --- 規則 componentDeps:元件的搭檔要列在檔頭 --------------------------------
//
// **有些元件不是一個自足的資料夾。** 它自己讀了某個 store 的話,只複製元件資料夾
// 搬過去不會報錯 —— import 得到、畫面也編譯得過,只是那個 store 不存在,
// 資料永遠是空的。找原因要從「為什麼沒反應」一路追到「原來少了一支 store」。
//
// 所以要在元件主檔的檔頭列出那幾支。**清單跟著檔案走**是重點:
// 複製過去的人不會回來跑來源專案的指令,但他一定會打開那支檔案。
//
// **工具只算 store 這一類,而且只對這一類負責。** 該列的沒列、或列了一支
// 已經不讀的 store,都報;清單裡其他東西(掛載用的容器、要一起搬的版型)一律放行 ——
// 那些是人補上去的。
//
// 容器不自動算進來的理由:容器用了某支元件,多數時候只是使用端
// (通用的錨點、圖片被十幾個地方用),而「為了驅動這支元件而存在的容器」
// 與「剛好用到它的容器」從程式碼上分不出來。猜錯的方向是把一堆使用端
// 寫進搬移清單,照著複製會把不相干的檔案一起搬走,比漏掉更難收拾。
//
// **轉場的樣式檔算,而且是漏掉最不容易發現的那一種。** 元件寫
// `<Transition name="popup-fade">`,而那個名字的樣式常常收在一支共用檔案裡,
// 由進入點一次載入,不在元件的資料夾底下。沒有一起複製過去的話,
// 元件**不會報錯也不會少畫面** —— 只是切換的當下沒有漸變,直接跳。
//
// 這一類算得準,所以工具自己算:名字是寫在畫面區段裡的,樣式那一側定義的
// 就是同一個名字接上框架的後綴,兩邊對得起來,沒有「是搭檔還是剛好用到」的模糊地帶。

/** 檔頭清單的起頭;後面接的每一個看起來像檔案路徑的字都算一項 */
const DEP_MARK = 'component-deps'
const DEP_PATH_RE = /[\w.@/-]+\.(?:m?js|cjs|ts|vue|css)/g

/** use{名稱}Store / use{名稱}Actions 的呼叫 */
const STORE_CALL_RE = /\b(use[A-Z]\w*(?:Store|Actions))\s*\(/g

/**
 * `<Transition>` 與 `<TransitionGroup>` 用到的轉場名字。
 *
 * 兩種寫法都讀:直接寫死的 `name="popup-fade"`,以及動態綁定裡引號內的字面
 * (`:name="isPopup ? 'a' : 'b'"` 讀得出 a 與 b 兩個)。後者一樣要算 ——
 * 一支元件的轉場全部寫在三元裡是常見的,只認寫死的話那種元件一個都算不到。
 *
 * 動態綁定裡**算出來的**名字(接變數、用樣板字串拼)讀不出來,那種就跳過;
 * 猜一個的話會把不相干的樣式檔寫進搬移清單。
 */
const TRANSITION_TAG_RE = /<Transition(?:Group)?\b[^>]*?>/g
const NAME_ATTR_RE = /(:?)name="([^"]*)"/
const NAME_LITERAL_RE = /'([\w-]+)'/g

const transitionNamesOf = (text) => {
  const names = new Set()

  for (const [tag] of text.matchAll(TRANSITION_TAG_RE)) {
    const attr = NAME_ATTR_RE.exec(tag)
    if (!attr) continue

    const [, dynamic, value] = attr

    if (!dynamic) {
      if (/^[\w-]+$/.test(value)) names.add(value)
      continue
    }

    for (const m of value.matchAll(NAME_LITERAL_RE)) names.add(m[1])
  }

  return names
}

/**
 * 這支元件複製的時候要一起帶走哪幾支檔案 —— 兩類:
 *
 *   store / actions   它自己讀的那幾支,不帶走的話資料永遠是空的
 *   轉場樣式          它用到的轉場定義在哪,不帶走的話切換沒有漸變
 *
 * 兩份索引都收在 shared.mjs 各一份 —— 取值那條規則也要問 store 那一側的事,
 * 各建一份的話同一個專案會被走訪兩次,而且其中一份改了判準另一份不會跟著。
 *
 * 回傳排序過的相對路徑,規則與指令印的是同一份。
 */
export const componentDepsOf = (root, rel, text) => {
  const { files: stores } = storeIndexOf(root)
  const transitions = transitionStyleIndexOf(root)
  const deps = new Set()

  for (const m of text.matchAll(STORE_CALL_RE)) {
    const file = stores.get(m[1])
    if (file) deps.add(file)
  }

  for (const name of transitionNamesOf(text)) {
    const file = transitions.get(name)

    /* 定義在這支元件自己的樣式裡時索引查不到,那本來就跟著元件走,不必列。 */
    if (file && !file.startsWith(`${path.dirname(rel)}/`)) deps.add(file)
  }

  return [...deps].sort()
}

/** 檔頭清單列了哪幾支;沒有那個標記回 null(與「列了但是空的」分開) */
const declaredDepsOf = (text) => {
  const at = text.indexOf(DEP_MARK)
  if (at === -1) return null

  /* 標記之後到那段註解結束為止 —— 註解結尾找不到時取整份,
     那個方向只會多讀幾行,而漏讀會把清單截斷、報成「少列了」。 */
  const end = text.indexOf('*/', at)

  return [...text.slice(at + DEP_MARK.length, end === -1 ? undefined : end).matchAll(DEP_PATH_RE)]
    .map((m) => m[0])
    .sort()
}

const checkComponentDeps = ({ rel, text, root }) => {
  if (!rel.startsWith(`${COMPONENTS_DIR}/`) || !rel.endsWith('.vue')) return []

  const actual = componentDepsOf(root, rel, text)
  const listed = declaredDepsOf(text) ?? []

  const missing = actual.filter((file) => !listed.includes(file))

  /* 多列的只看工具自己算得準的那兩類:store 與轉場樣式檔。列了一支已經不讀的
     store、或已經不用的轉場,就是過期。其他項目(掛載用的容器、要一起搬的版型)
     是人自己補的,工具沒有立場說它多餘。 */
  const transitionFiles = new Set(transitionStyleIndexOf(root).values())

  const stale = listed.filter(
    (file) =>
      (file.startsWith(`${STORE_DIR}/`) || transitionFiles.has(file)) && !actual.includes(file)
  )

  if (!missing.length && !stale.length) return []

  const line = listed.length ? lineNoOf(text, text.indexOf(DEP_MARK)) : 1

  if (!missing.length) {
    return [
      issueOf(
        rel,
        line,
        'componentDeps',
        `檔頭的 ${DEP_MARK} 列了 ${stale.join('、')},但這支元件已經不用它了 —— 清單過期,拿掉那幾行`
      ),
    ]
  }

  return [
    issueOf(
      rel,
      line,
      'componentDeps',
      `複製這支元件的時候有幾支檔案要一起帶走 —— 檔頭寫一段 ${DEP_MARK} 註解,列出:${actual.join('、')}` +
        (stale.length ? `(${stale.join('、')} 已經不用了,拿掉)` : '') +
        ';只複製元件資料夾的話搬過去不會報錯,而是 store 不存在、資料永遠是空的,' +
        '或是轉場的樣式沒跟過去、切換的當下直接跳沒有漸變'
    ),
  ]
}

// --- 規則 transitionShared:轉場的樣式一律放共用檔 ----------------------------
//
// **寫轉場之前先去共用的轉場樣式檔看有沒有現成的。** 淡入淡出、縮放、滑入、
// 高度展開 —— 這幾種每個專案都會用到好幾次,而寫在自己元件裡的那一份,
// 別人找不到也不會想到要找。於是同一種動畫被實作第二次、第三次,
// 秒數各差一點,畫面上就出現「明明都是淡入,這裡比較快」的不一致。
//
// **沒有適合的就在共用檔新增一組,而且名字要取得夠通用。** 名字照效果取
// (fade / zoom / slide-up),不照元件或位置取(popup-fade / tooltip-content /
// backdrop)—— 綁了元件或角色的名字,下一個人即使看到了也不敢用:
// 他要做的不是彈窗,而那個名字寫著 popup。
//
// 這條與「元件的樣式放在元件自己的資料夾」不衝突,兩者分的是不同的東西:
// 長相(顏色、間距、字級)屬於那支元件,而動作(怎麼進場、怎麼離場)是跨元件的詞彙。
//
// 判準只看「這份樣式有沒有定義轉場」,不看它長什麼樣 ——
// 動畫內容是人要決定的,工具只認得出位置放錯了。

const checkTransitionShared = ({ rel, text }) => {
  if (!rel.startsWith(`${COMPONENTS_DIR}/`)) return []
  if (!/\.(css|vue)$/.test(rel)) return []

  /* .vue 只看樣式區段 —— 畫面區段寫的 name 是「用」不是「定義」,
     而那正是這條要人去做的事。 */
  const styles = rel.endsWith('.vue')
    ? [...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
    : text

  const names = [...transitionNamesInCss(styles)].sort()
  if (!names.length) return []

  return [
    issueOf(
      rel,
      lineNoOf(text, text.indexOf(names[0])),
      'transitionShared',
      `這裡定義了轉場(${names.join('、')})—— 搬到共用的轉場樣式檔,` +
        '別的元件才找得到、也才不會有人把同一種動畫再實作一次;' +
        '共用檔裡已經有同樣效果的話直接用那一組,名字照效果取(fade / zoom / slide-up),' +
        '不要取成 popup-fade 這種綁元件、或 backdrop 這種綁位置的名字'
    ),
  ]
}

// --- 規則 spacerElement:不要用空元素當間隔 ----------------------------------
//
// 兩個元素之間要留空隙時用 css(gap / margin),不要放一個只有空白的元素。
//
// **Vue 編譯畫面區段時會把那個空白整個移除** —— `<span> </span>` 從一開始
// 就沒有作用,而原始碼看起來像是有留一個空格。要真的留一個空白只有 `&nbsp;`
// 做得到,但那是內容(文案裡本來就有的空格),不是排版。
//
// 兩種標籤除外:它們裡面的空白是內容的一部分,編譯器不會動。

/** 空白有意義的標籤 —— 裡面的空格照原樣顯示 */
const WHITESPACE_KEPT_TAGS = new Set(['pre', 'textarea'])

/** <tag> </tag> —— 同一行、中間只有空白的元素 */
const SPACER_ELEMENT_RE = /<([a-zA-Z][\w-]*)(?:\s[^>]*)?>[ \t]+<\/\1>/g

/**
 * `</b> <b>` —— 同一行,兩個元素之間只有空白。
 *
 * 只看「後面接的是開標籤」那一種:接閉標籤的是空元素,由上面那一式抓,
 * 兩式都報的話同一個地方會出現兩筆,而修法只有一個。
 *
 * 換行不算 —— 含換行的空白在編譯時整個被移除,那種寫法本來就沒有在靠空白排版。
 */
const SPACER_BETWEEN_RE = />[ \t]+<(?!\/)[a-zA-Z]/g

const checkSpacerElement = ({ rel, text }) => {
  if (!rel.endsWith('.vue')) return []

  const tpl = templateRangeOf(text)
  if (!tpl) return []

  const body = maskHtmlComments(tpl.body)

  const empty = [...body.matchAll(SPACER_ELEMENT_RE)]
    .filter(([, tag]) => !WHITESPACE_KEPT_TAGS.has(tag.toLowerCase()))
    .map((m) => ({
      index: m.index,
      detail:
        `<${m[1]}> 裡只有空白 —— 那個空白在編譯時就被移除了,它從一開始就沒有作用;` +
        `要在兩個元素之間留空隙用 css 的 gap 或 margin,文案裡本來就有的空格才用 &nbsp;`,
    }))

  const between = [...body.matchAll(SPACER_BETWEEN_RE)].map((m) => ({
    index: m.index,
    detail:
      '兩個元素之間靠一個空白留空隙 —— 排版工具把它折成兩行時那個空白就沒了,' +
      '而原始碼看起來完全正常;間隔用 css 的 gap 或 margin,文案裡本來就有的空格才用 &nbsp;',
  }))

  return [...empty, ...between]
    .sort((a, b) => a.index - b.index)
    .map(({ index, detail }) =>
      issueOf(rel, lineNoOf(text, tpl.offset + index), 'spacerElement', detail)
    )
}

export const CODE_CHECKS = [
  checkComponentDeps,
  checkTransitionShared,
  checkSpacerElement,
  checkImportAlias,
  checkDeprecated,
  checkImportOrder,
  checkVueFileName,
  checkFormGroupValidate,
  checkComponentClass,
  checkComponentFolder,
  checkViewFolder,
]

/* composableOrder 沒有出現在這兩張表裡 —— 它不報違規,存檔時直接把順序排好。
   自動修正的行為在 onSortComposables。 */

export const CODE_RULE_TITLE = {
  importOrder: '元件沒有載入樣式',
  vueFileName: '.vue 的檔名怎麼取',
  formGroupValidate: '一組控制項各自帶了驗證',
  componentClass: '資料夾名對不上組件 class',
  componentFolder: '元件沒有自己的資料夾',
  viewFolder: '頁面目錄的資料夾命名',
  importAlias: 'import 沒有使用 alias',
  deprecated: '已淘汰的寫法',
  spacerElement: '用空元素當間隔',
  componentDeps: '元件的搭檔沒有列在檔頭',
  transitionShared: '轉場的樣式寫在元件裡',
}

export const CODE_RULE_HINT = {
  importOrder: '元件的樣式寫在 CSS 模組裡,由元件自己 import(分組順序存檔時自動排好)',
  vueFileName: '元件首字大寫、主檔叫 Index.vue;頁面首字小寫',
  formGroupValidate: `一組共用一個名字的控制項,驗證掛在包住整組的 ${FORM_GROUP_VALIDATOR} 上,只顯示一則訊息`,
  componentClass: '資料夾 mXxx 對 .m-xxx —— 模組 css 的前綴是從資料夾名推出來的',
  componentFolder: '分類資料夾底下不要直接放 .vue,建一個自己的資料夾',
  viewFolder: '資料夾首字小寫(那是網址的一段);底線資料夾只能用設定裡列的那幾個名字',
  importAlias: '離開自己資料夾的相對路徑改用 @ alias',
  deprecated: 'apiParams / inject(route) 已淘汰;actions 不留 console.log、不 bare 透傳',
  spacerElement: '空白在編譯時就被移除了 —— 間隔用 css 的 gap 或 margin',
  componentDeps: '複製這支元件時要一起帶走的東西,列在它的檔頭(npm run deps 印得出來)',
  transitionShared: '轉場放共用的轉場樣式檔,先看有沒有現成的;要新增就照效果命名,別人才用得到',
}
