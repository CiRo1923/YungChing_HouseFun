// 程式碼撰寫規範 —— import 路徑、composable 宣告順序、已淘汰的寫法。
//
// 這三條原本只有 PreToolUse 的阻擋式 hook(.claude/hooks/enforce-*.cjs),
// 也就是**只有 AI 寫檔時才檢查,人自己寫的完全不會被抓**;而且判斷邏輯有兩份,
// 遲早會漂移。收進引擎之後五層守門都適用,判斷只留這一份。

import fs from 'node:fs'
import path from 'node:path'
import {
  BUILD_CONFIG_FILES,
  PROJECT_CONFIG_FILES,
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
 * ⚠️ 冒號到路徑之間允許有逗號 —— path.resolve(process.cwd(), '…') 這種寫法
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
// ⚠️ 兩個宣告之間若夾了別的語句(storeToRefs / computed / ref …),那是「屏障」——
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
       那一行會變成屏障(下面 groupByBarrier 判斷)。 */
    let rank = null
    let role = null
    let label = ''

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
 * ⚠️ 這個函式會直接改動程式碼。安全前提有三個,少一個就可能改壞:
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

  // 每一組各自排序,排完把行內容依新順序填回原本那幾行的位置
  const nextLines = [...lines]
  let changed = false

  for (const group of groups) {
    if (group.length < 2) continue

    const sorted = [...group].sort((a, b) => {
      const [ar, as] = a.tuple
      const [br, bs] = b.tuple
      return ar - br || as - bs || group.indexOf(a) - group.indexOf(b)
    })

    if (sorted.every((d, i) => d === group[i])) continue

    // 這一組佔用的行(由上而下),把排序後的內容依序放回去
    const slots = group.flatMap((d) => {
      const range = []
      for (let ln = d.start; ln <= d.end; ln += 1) range.push(ln)
      return range
    })

    const content = sorted.flatMap((d) => lines.slice(d.start, d.end + 1))

    // 行數必須完全相同 —— 不同就代表解析有落差,寧可不動
    if (slots.length !== content.length) continue

    slots.forEach((ln, i) => {
      nextLines[ln] = content[i]
    })

    changed = true
  }

  if (!changed) return null

  const nextBody = nextLines.join('\n')
  const before = text.slice(0, match.index)
  const after = text.slice(match.index + match[0].length)
  const rebuilt = match[0].replace(match[1], nextBody)

  return `${before}${rebuilt}${after}`
}

export const CODE_CHECKS = [checkImportAlias, checkDeprecated]

/* composableOrder 沒有出現在這兩張表裡 —— 它不報違規,存檔時直接把順序排好。
   自動修正的行為在 onSortComposables。 */

export const CODE_RULE_TITLE = {
  importAlias: 'import 沒有使用 alias',
  deprecated: '已淘汰的寫法',
}

export const CODE_RULE_HINT = {
  importAlias: '離開自己資料夾的相對路徑改用 @ alias',
  deprecated: 'apiParams / inject(route) 已淘汰;actions 不留 console.log、不 bare 透傳',
}
