// Store 規範 —— store 只放狀態宣告,行為一律進 .composables 的 actions。
//
// 拆開的理由跟 api 一樣:store 檔案一旦開始放 function,它就同時是「狀態定義」
// 與「行為實作」,兩種東西混在一起之後,要找某個行為得先猜它在 store 還是 actions。

import fs from 'node:fs'
import path from 'node:path'
import {
  ACTIONS_DIR_NAME,
  STANDALONE_STORES,
  STORE_DIR,
  VIEWS_DIR,
  bodyRangeOf,
  findNearFolder,
  isInActionsDir,
  isInSrc,
  issueOf,
  lineNoOf,
  listViewFolders,
} from './shared.mjs'

/** 行為放在 store 目錄底下的這個子資料夾 */
const ACTIONS_DIR = `${STORE_DIR}/${ACTIONS_DIR_NAME}`

/**
 * 不對應任何頁面資料夾、但確實需要獨立存在的 store。
 *
 * 清單定義在 project-config.mjs 的 STANDALONE_STORES —— 每個專案的跨頁面
 * 基礎建設(彈窗、登入、靜態資料這類)不一樣,寫在規則裡的話,
 * 換一個專案就會把它自己的基礎建設全部報成違規。
 *
 * ⚠️ 加進那份清單之前先想清楚「它為什麼不屬於任何一個頁面」——
 *    想不出理由就是該歸到某個頁面底下,不要放進去。
 */
const ALLOWED_STANDALONE = new Set(STANDALONE_STORES)

// 「這個檔案在不在放行為的那個子資料夾底下」的判斷收在 shared.mjs 一份 ——
// 多個規則都要問這個問題,各自寫一次的話,換一個命名的專案只會有部分規則跟著改
const isInActions = isInActionsDir

const isStoreFile = (rel) =>
  rel.startsWith(`${STORE_DIR}/`) &&
  rel.endsWith('.js') &&
  !isInActions(rel) &&
  path.basename(rel) !== 'index.js' // pinia 實例本身

const isActionsFile = (rel) => rel.startsWith(`${STORE_DIR}/`) && isInActions(rel) && rel.endsWith('.js')

// --- 規則 storeDir:store 資料夾全站只用一種名稱 -----------------------------
//
// 正確的名稱就是設定裡 store 目錄的最後一層(project-config.mjs 的 STORE_DIR)。
// 這裡不寫死名稱 —— 寫死之後,把 store 放在別的資料夾名的專案,
// 會被這條規則把每一支 store 檔都報成違規。
//
// 抓的是「同一個名稱的其他寫法」:少了字尾 s、首字大寫、兩者都有。
// 全站混用兩種寫法的話,每次寫 import 都要先確認這一支是哪一種。

/** store 目錄的最後一層,例如設定為 `src/stores` 時就是 `stores` */
const STORE_DIR_NAME = STORE_DIR.split('/').pop()

/** 同一個名稱容易被寫成的其他樣子 —— 大小寫與單複數的組合,不含正確的那一個 */
const wrongDirNamesOf = (name) => {
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1)
  const singular = name.endsWith('s') ? name.slice(0, -1) : null
  const singularCapitalized = singular
    ? singular.charAt(0).toUpperCase() + singular.slice(1)
    : null

  return [...new Set([capitalized, singular, singularCapitalized].filter(Boolean))].filter(
    (v) => v !== name
  )
}

const WRONG_DIR_NAMES = wrongDirNamesOf(STORE_DIR_NAME)

const WRONG_DIR_RE = WRONG_DIR_NAMES.length
  ? new RegExp(`(^|/)(${WRONG_DIR_NAMES.join('|')})/`)
  : null

const checkStoreDir = ({ rel }) => {
  if (!WRONG_DIR_RE || !isInSrc(rel)) return []

  const m = rel.match(WRONG_DIR_RE)
  if (!m) return []

  return [
    issueOf(
      rel,
      1,
      'storeDir',
      `資料夾 ${m[2]}/ 要改成 ${STORE_DIR_NAME}/ —— 全站統一一種寫法,否則 import 路徑得逐次確認是哪一種`
    ),
  ]
}

// --- 規則 storeDeclare:store 只放宣告,不放 function -------------------------
//
// 可以有 computed(那是衍生狀態,不是行為),但不能有 function / 箭頭函式。

/** 允許出現在 store 的初始化函式 —— 這些是「宣告狀態」不是「寫行為」 */
const DECLARE_CALLS = new Set([
  'ref',
  'shallowRef',
  'reactive',
  'shallowReactive',
  'readonly',
  'shallowReadonly',
  'computed',
  'toRef',
  'toRefs',
  'markRaw',
])

/** const x = () => …  /  const x = function …  /  function x() … */
const FN_DECLARE_RE =
  /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|\w+\s*=>)|^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/

/** const x = ref(…) 的 ref 部分 */
const INIT_CALL_RE = /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(\w+)\s*\(/

/** 物件屬性寫成函式:onDo: () => {} / onDo: function () {} */
const OBJECT_METHOD_RE = /^\s*(\w+)\s*:\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|\w+\s*=>)/

const checkStoreDeclare = ({ rel, text }) => {
  if (!isStoreFile(rel)) return []

  const issues = []
  const hint = `行為一律放 ${ACTIONS_DIR}/use{名稱}Actions.js —— store 只放狀態宣告(computed 可以,那是衍生狀態)`

  text.split(/\r?\n/).forEach((line, i) => {
    // defineStore('x', () => { … }) 的 setup 函式本身不算
    if (/defineStore\s*\(/.test(line)) return

    const fn = line.match(FN_DECLARE_RE)
    if (fn) {
      issues.push(issueOf(rel, i + 1, 'storeDeclare', `store 裡宣告了 function ${fn[1] ?? fn[2]} —— ${hint}`))
      return
    }

    const init = line.match(INIT_CALL_RE)

    // 取用另一個 store(useXxxStore / storeToRefs)是 pinia 的正常用法,不是行為
    const isStoreAccess = /^use[A-Z]\w*Store$/.test(init?.[2] ?? '') || init?.[2] === 'storeToRefs'

    if (init && !DECLARE_CALLS.has(init[2]) && !isStoreAccess) {
      issues.push(
        issueOf(
          rel,
          i + 1,
          'storeDeclare',
          `${init[1]} 用 ${init[2]}() 初始化 —— store 只能用 ${[...DECLARE_CALLS].slice(0, 6).join(' / ')} 這類宣告;${hint}`
        )
      )
      return
    }

    const method = line.match(OBJECT_METHOD_RE)
    if (method) {
      issues.push(
        issueOf(rel, i + 1, 'storeDeclare', `物件屬性 ${method[1]} 是 function —— ${hint}`)
      )
    }
  })

  return issues
}

// --- 規則 storeNaming:store 要叫 use{名稱}Store ------------------------------

const DEFINE_STORE_RE = /export\s+const\s+(\w+)\s*=\s*defineStore\s*\(/g

const checkStoreNaming = ({ rel, text }) => {
  if (!isStoreFile(rel)) return []

  const matches = [...text.matchAll(DEFINE_STORE_RE)]

  if (!matches.length) {
    return /defineStore\s*\(/.test(text)
      ? [
          issueOf(
            rel,
            lineNoOf(text, text.search(/defineStore\s*\(/)),
            'storeNaming',
            'store 要用 export const use{名稱}Store = defineStore(…) 具名匯出 —— 使用端才找得到它'
          ),
        ]
      : []
  }

  return matches
    .filter((m) => !/^use[A-Z]\w*Store$/.test(m[1]))
    .map((m) =>
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'storeNaming',
        `${m[1]} 要改成 use{名稱}Store 的形式 —— 看到名字就知道它是 store,不必翻檔案`
      )
    )
}

// --- 規則 storeScope:檔名要對得上頁面資料夾 ---------------------------------

const checkStoreScope = ({ rel, root }) => {
  if (!isStoreFile(rel)) return []

  const folders = listViewFolders(root)
  if (!folders) return []

  const name = path.basename(rel, '.js')
  if (folders.has(name) || ALLOWED_STANDALONE.has(name)) return []

  const near = findNearFolder(folders, name)

  return [
    issueOf(
      rel,
      1,
      'storeScope',
      near
        ? `檔名 ${name}.js 對不上資料夾 —— ${VIEWS_DIR} 底下是 ${near}/,兩邊要一致(改檔名或改資料夾名)`
        : `檔名 ${name}.js 在 ${VIEWS_DIR} 底下沒有對應的資料夾 —— store 依頁面資料夾切分;跨頁面的基礎建設才加進 ALLOWED_STANDALONE,並在那裡寫清楚理由`
    ),
  ]
}

// --- 規則 storeActions:actions 檔名要叫 use{名稱}Actions.js ------------------

const checkActionsNaming = ({ rel }) => {
  if (!isActionsFile(rel)) return []

  const name = path.basename(rel, '.js')
  if (/^use[A-Z]\w*Actions$/.test(name)) return []

  return [
    issueOf(
      rel,
      1,
      'storeActions',
      `檔名 ${name}.js 要改成 use{名稱}Actions.js —— 與 store 成對,看檔名就知道是誰的行為`
    ),
  ]
}


// --- 規則 storeLayer:store 的結構跟著頁面分層 -------------------------------
//
// **一個頁面一層,層名就是頁面名(首字小寫)。** 每一層基本上會有兩種東西:
//   data     api 回來的資料
//   apiData  要送給 api 的資料(預設值集中在 apiDefault,見 storeApiDefault)
//
// 分層跟著頁面走,才能「看到頁面就知道資料在 store 的哪裡」。
// 反過來也成立:看到 store 裡某一層,知道它是給哪一頁用的,改的時候知道會影響誰。
//
// **分類資料夾只在需要分辨時才佔一層。** 頁面群底下常常再分資料夾,
// 把性質相近的頁面擺在一起,那是檔案的分類,不是一份狀態 ——
// 多包的那一層沒有東西住在裡面,只是把路徑加長,每個使用端都要多寫一段。
// 所以層名預設取頁面檔名,不含資料夾。
//
// 但同一個頁面群裡常有好幾支同名的頁面(每個分類底下各一支 Index 與 Detail)。
// 那時扁平的層名會撞在一起,而**撞在一起就等於兩頁共用同一份狀態** ——
// 一頁改了另一頁跟著變,而且看不出來是誰改的。
// 所以撞名的那幾支才把分類資料夾補回來當一層:
//
//   <頁面群>/Single.vue             →  const single = ref({ … })          ← 沒撞,扁平
//   <頁面群>/<分類A>/Detail.vue     →  const <分類A> = ref({ detail: … }) ← 撞了,資料夾佔一層
//   <頁面群>/<分類B>/Detail.vue     →  const <分類B> = ref({ detail: … })
//
// 角括號是要換掉的部分 —— 每個專案的資料夾叫什麼由專案自己決定,
// 這條規則管的是「撞名的才多包一層」。
//
// 名字只在需要分辨的時候才變長,沒撞的維持最短。
//
// **只看有打 api 的頁面。** 純版型頁、靜態說明頁本來就沒有狀態,
// 要求它們也有一層,補出來的會是沒有人讀的空層 —— 那正是
// 「沒有頁面要用就不要加狀態」在擋的事情。判斷方式是頁面裡有沒有呼叫 action。
//
// ⚠️ **這條是提醒,不是結論。** 規則看得到「這一頁打了 api、store 沒有同名的層」,
//    看不出那份資料實際上該放哪裡 —— 兩頁共用同一份資料、或那一頁的資料
//    本來就屬於別的層,都是合理的。收到提醒之後由人判斷,
//    確定不需要那一層就用註解豁免,並寫下理由。

/** 頁面檔(遞迴);底線與點開頭的資料夾是元件 / 工具目錄,裡面不是頁面 */
const listPageFiles = (root, folder) => {
  const abs = path.join(root, ...VIEWS_DIR.split('/'), folder)
  if (!fs.existsSync(abs)) return []

  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return /^[._]/.test(e.name) ? [] : listPageFiles(root, `${folder}/${e.name}`)
    return e.name.endsWith('.vue') ? [{ file: `${folder}/${e.name}`, abs: path.join(abs, e.name) }] : []
  })
}

/**
 * 頁面名 → 層名。`Index.vue` → `index`、`PetFair.vue` → `petFair`。
 *
 * 只把首字轉小寫,其餘保持原樣 —— 駝峰的字要怎麼拆是語意問題,
 * 工具全轉小寫的話 `PetFair` 會變成 `petfair`,與人寫出來的名字對不上。
 */
const layerNameOf = (pageFile) => {
  const base = path.basename(pageFile, '.vue')
  return base.charAt(0).toLowerCase() + base.slice(1)
}

/**
 * 頁面檔在頁面群底下的分類資料夾 —— 直接放在頁面群第一層的回空字串。
 *
 * 巢狀再深時取最靠近頁面檔的那一層。撞名要分辨的是「這一支 Detail 是哪一類的」,
 * 最靠近的那一層就是答案;把整串路徑接起來只會讓名字變長,分辨力沒有增加。
 */
const pageFolderOf = (pageFile) => {
  const segments = pageFile.split('/').slice(1, -1) // 去掉頁面群與檔名
  return segments.length ? segments[segments.length - 1] : ''
}

/** 這一頁有沒有向後端要資料 —— 呼叫 action 就算 */
const PAGE_CALLS_ACTION_RE = /\bon(?:Api|Json)\w*\s*\(/

/**
 * 取出 `const <name> = ref({ … })` 大括號裡的內容。
 *
 * 只用來看「這一層底下有沒有宣告某個 key」,不解析結構 ——
 * 巢狀物件用 regex 解析很容易出錯,而這裡只需要知道 key 在不在。
 */
const layerBodyOf = (text, name) => {
  const m = new RegExp(`const\\s+${name}\\s*=\\s*(?:ref|reactive|readonly|shallowRef)\\s*\\(`).exec(
    text
  )
  if (!m) return null

  const start = text.indexOf('{', m.index + m[0].length - 1)
  return start === -1 ? '' : bodyRangeOf(text, start)
}

const LAYER_EXEMPT_RE = /lint-store-layer-exempt/

const checkStoreLayer = ({ rel, text, root }) => {
  if (!isStoreFile(rel)) return []
  if (LAYER_EXEMPT_RE.test(text)) return []

  const name = path.basename(rel, '.js')

  const folders = listViewFolders(root)
  if (!folders?.has(name)) return [] // 對不上頁面資料夾的由 storeScope 處理

  // store 第一層的宣告名稱
  const declared = new Set(
    [...text.matchAll(/^\s*const\s+(\w+)\s*=\s*(?:ref|reactive|readonly|shallowRef)\s*\(/gm)].map(
      (m) => m[1]
    )
  )

  // 有向後端要資料的頁面 —— 沒有要資料的頁面本來就不需要狀態
  const pages = []

  for (const page of listPageFiles(root, name)) {
    /* 刻意不給初值:讀失敗的那一條路直接 continue,下面用得到它時一定已經讀成功。
       給了初值反而讓「讀失敗」變成拿空字串繼續判斷,而空字串看起來就像
       「這一頁沒有打 api」—— 那一頁會被靜靜地跳過。 */
    let pageText

    try {
      pageText = fs.readFileSync(page.abs, 'utf8')
    } catch {
      continue // 讀不到就當作沒看到,不要讓檔案權限問題變成違規
    }
    if (!PAGE_CALLS_ACTION_RE.test(pageText)) continue

    pages.push({
      file: page.file,
      layer: layerNameOf(page.file),
      folder: pageFolderOf(page.file),
    })
  }

  // 同一個層名有兩支以上頁面 —— 那幾支要靠分類資料夾分辨
  const countByLayer = new Map()
  for (const p of pages) countByLayer.set(p.layer, (countByLayer.get(p.layer) ?? 0) + 1)

  const missing = []

  for (const p of pages) {
    const isClashing = countByLayer.get(p.layer) > 1 && p.folder

    if (!isClashing) {
      if (!declared.has(p.layer)) missing.push({ expect: p.layer, file: p.file })
      continue
    }

    // 撞名:要有分類資料夾那一層,而且那一層底下要有這一頁的 key
    if (!declared.has(p.folder)) {
      missing.push({ expect: `${p.folder}.${p.layer}`, file: p.file })
      continue
    }

    const body = layerBodyOf(text, p.folder)
    if (body !== null && !new RegExp(`\\b${p.layer}\\s*:`).test(body)) {
      missing.push({ expect: `${p.folder}.${p.layer}`, file: p.file })
    }
  }

  if (!missing.length) return []

  /* 一支 store 只報一筆,把缺的層一次列完 —— 一頁一筆的話,
     一支 store 可能一口氣出現十幾筆同一件事,把其他規則的訊息擠掉。 */
  const list = missing.map((m) => `${m.expect}(${VIEWS_DIR}/${m.file})`).join('、')

  return [
    issueOf(
      rel,
      1,
      'storeLayer',
      `這幾頁有向後端要資料,store 沒有對應的層:${list} —— ` +
        `一個頁面一層、層名就是頁面名首字小寫;` +
        `同一群裡有好幾支同名頁面時,那幾支用分類資料夾多包一層分辨 —— 上面每一筆前面就是該有的層名;` +
        `那份資料其實屬於別的層、或兩頁確實共用同一份的話,標 /* lint-store-layer-exempt: 理由 */`
    ),
  ]
}

// --- 規則 storeActionNaming:呼叫 api 的 action 命名 --------------------------
//
//   apiMemberInfoGet  →  onApiMemberInfoGet
//
// 就是 api 函式名前面加 on。這樣從 action 名字直接看得出它打的是哪一支 api,
// 不必翻進函式body 找;api 改名時,對不上的 action 也會被規則抓出來。
//
// 一個 action 打多支 api 時(例如取完清單再取明細)只檢查 onApi 前綴,
// 因為沒辦法斷定該用哪一支的名字 —— 那是人要決定的。
//
// **同一支 api 被同一支 actions 檔裡的兩個 action 用到時,名字要帶上層名。**
//
//   onApiGetVoucherListIndex   → index 那一層
//   onApiGetVoucherListDetail  → detail 那一層
//
// 為什麼要拆成兩個 action 而不是共用一個:兩頁要的東西不一樣。
// 清單頁要的是整份列表,內頁要的是其中一筆加上明細欄位 —— 共用一個 action
// 就得在裡面加「誰在呼叫」的判斷,或是兩頁共用同一份狀態,
// 一頁換頁回來另一頁的畫面就跟著變,而且看不出來是誰改的。
//
// api 本身維持一份、名字不變(`api` + method + endpoint);
// 分開的是「拿到之後放進哪一層」,那屬於 action。
//
// 後綴只在需要分辨時才加 —— 一支 api 只有一個 action 在用的話,
// 名字維持最短的 `on` + api 名。

const ACTION_FN_RE = /const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/g

/** 這個 action 把結果寫進 store 的哪幾層 —— storeToRefs 取出來的變數才有 .value */
const LAYER_WRITE_RE = /\b(\w+)\.value\b/g

const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * 兩個 action 名稱算不算同一個 —— 比對時忽略底線。
 *
 * endpoint 裡出現底線時(`questionnaire/q3_1`),api 那層照著寫成
 * `apiPostQuestionnaireQ3_1`,名字與網址一眼對得起來;
 * 但 action 是程式裡到處被呼叫的識別字,底線夾在數字中間讀起來卡,
 * 所以那一層寫成 `onApiPostQuestionnaireQ31`。
 *
 * 兩層只差這一個符號,不該因此被判成「名稱對不上」。
 */
const isSameActionName = (a, b) => a.replace(/_/g, '') === b.replace(/_/g, '')

const checkActionApiNaming = ({ rel, text }) => {
  if (!isActionsFile(rel)) return []

  const issues = []

  /* 先收齊這支檔案裡所有打 api 的 action,再一起判斷 ——
     「這支 api 有沒有第二個 action 在用」要看過整份檔案才知道。 */
  const actions = []

  for (const m of text.matchAll(ACTION_FN_RE)) {
    const name = m[1]

    // useXxxActions 是外層的 composable 本身,不是 action —— 它的 body 當然含 api 呼叫
    if (/^use[A-Z]\w*Actions$/.test(name)) continue

    const body = bodyRangeOf(text, m.index + m[0].length - 1)

    // 函式內呼叫的 api（apiXxx(...)）
    const called = [...new Set([...body.matchAll(/\b(api[A-Z]\w*)\s*\(/g)].map((x) => x[1]))]
    if (!called.length) continue

    actions.push({
      name,
      called,
      index: m.index,
      layers: [...new Set([...body.matchAll(LAYER_WRITE_RE)].map((x) => x[1]))],
    })
  }

  // 同一支 api 被幾個 action 用到 —— 只算「只打這一支」的,多支的本來就不比對完整名稱
  const countByApi = new Map()
  for (const a of actions) {
    if (a.called.length !== 1) continue
    countByApi.set(a.called[0], (countByApi.get(a.called[0]) ?? 0) + 1)
  }

  for (const a of actions) {
    const line = lineNoOf(text, a.index)
    const [api] = a.called

    if (!/^onApi[A-Z]/.test(a.name)) {
      issues.push(
        issueOf(
          rel,
          line,
          'storeActionNaming',
          `${a.name} 有呼叫 api,要命名為 onApi… —— 建議 on${upperFirst(api)}`
        )
      )
      continue
    }

    // 只呼叫一支 api 時才比對完整名稱；多支時無法斷定該用哪一支
    if (a.called.length > 1) continue

    const base = `on${upperFirst(api)}`

    /* 這支 api 只有一個 action 在用 —— 名字維持最短,不必帶層名。
       帶了也不算錯(層名後綴無法與 endpoint 的最後一段區分),所以只比對基本形。 */
    if (countByApi.get(api) === 1) {
      if (isSameActionName(a.name, base)) continue

      issues.push(
        issueOf(
          rel,
          line,
          'storeActionNaming',
          `${a.name} 呼叫的是 ${api},名稱要對得上 —— 建議 ${base}(api 函式名前面加 on)`
        )
      )
      continue
    }

    // 兩個以上的 action 用同一支 api —— 各自要帶上自己寫進哪一層
    const expected = a.layers.map((layer) => `${base}${upperFirst(layer)}`)
    if (expected.some((name) => isSameActionName(a.name, name))) continue

    const hint = expected.length
      ? `建議 ${expected.join(' 或 ')}`
      : `這支沒有寫進任何一層,先確認它該把資料放哪裡`

    issues.push(
      issueOf(
        rel,
        line,
        'storeActionNaming',
        `${a.name} 與另一個 action 都呼叫 ${api},名字要帶上各自寫進哪一層才分得開 —— ${hint};` +
          `兩邊本來就該是各自的狀態,不要共用同一層`
      )
    )
  }

  return issues
}

// --- 規則 storeActionReturn:呼叫 api 的 action 要回傳固定三件 ---------------
//
//   return { config, status, data }
//
// 三個都要,而且形狀固定 —— 使用端才能一律用同一種寫法接:
//
//   const { status, data } = await onApiMemberInfoGet()
//   if (status !== 200) return
//
// 少了 status,使用端就得自己想辦法判斷成功失敗;少了 data,拿不到內容;
// 少了 config,錯誤處理時不知道是打哪一支、帶了什麼參數。
// 每支 action 各自決定回傳什麼的話,使用端要為每一支記一種接法。

const RETURN_FIELDS = ['config', 'status', 'data']

const checkActionReturn = ({ rel, text }) => {
  if (!isActionsFile(rel)) return []

  const issues = []

  for (const m of text.matchAll(ACTION_FN_RE)) {
    const name = m[1]
    if (/^use[A-Z]\w*Actions$/.test(name)) continue

    const body = bodyRangeOf(text, m.index + m[0].length - 1)
    if (!/\bapi[A-Z]\w*\s*\(/.test(body)) continue // 沒打 api 的不受這條限制

    // 只看這個函式自己的 return 物件(巢狀函式的 return 不算)
    const returns = [...body.matchAll(/return\s*\{([^}]*)\}/g)].map((r) => r[1])

    if (!returns.length) {
      issues.push(
        issueOf(
          rel,
          lineNoOf(text, m.index),
          'storeActionReturn',
          `${name} 打了 api 卻沒有回傳 —— 一律 return { ${RETURN_FIELDS.join(', ')} },使用端才能用同一種寫法接`
        )
      )
      continue
    }

    // 任一個 return 物件湊齊三件就算通過(early-return 的分支可以只回部分)
    const complete = returns.some((body2) =>
      RETURN_FIELDS.every((f) => new RegExp(`\\b${f}\\b`).test(body2))
    )

    if (complete) continue

    const missing = RETURN_FIELDS.filter(
      (f) => !returns.some((body2) => new RegExp(`\\b${f}\\b`).test(body2))
    )

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'storeActionReturn',
        `${name} 的回傳缺少 ${missing.join(' / ')} —— 一律 return { ${RETURN_FIELDS.join(', ')} }`
      )
    )
  }

  return issues
}


// --- 規則 storeApiDefault:送出參數的預設值集中在 apiDefault -----------------
//
//   const apiDefault = readonly({
//     detail: {
//       delivery: { LastName: null, Phone: null, … },
//       linePoint: { Amount: 1, Id: null },
//     },
//   })
//
//   detail.delivery.apiData = { ...apiDefault.detail.delivery }
//
// 結構跟著 store 的分層走(見 storeLayer),要找某一層的預設值時路徑是一樣的。
//
// **一定要 readonly** —— 這份是「還原用的原始值」,不是狀態。少了 readonly,
// 任何一次 `apiDefault.detail.delivery.Phone = x` 都會把原始值改掉,
// 之後每一次 reset 都還原成被改過的值,而且完全沒有徵兆。
//
// 預設值散在各處的話:改一個欄位要同時記得改 store 的初始值與每一支 reset,
// 漏掉一邊不會報錯 —— 只會在「送出前先重填一次」的流程裡帶到舊值。

const checkStoreApiDefault = ({ rel, text }) => {
  if (!isStoreFile(rel)) return []
  if (!/\bapiData\b/.test(text)) return [] // 沒有送出參數的 store 不需要

  const declared = /\bconst\s+apiDefault\s*=\s*(\w+)?\s*\(?/.exec(text)

  if (!declared) {
    return [
      issueOf(
        rel,
        lineNoOf(text, text.search(/\bapiData\b/)),
        'storeApiDefault',
        `有 apiData 卻沒有 apiDefault —— 送出參數的預設值集中成 const apiDefault = readonly({ … }),reset 才能直接展開還原`
      ),
    ]
  }

  if (declared[1] === 'readonly') return []

  return [
    issueOf(
      rel,
      lineNoOf(text, declared.index),
      'storeApiDefault',
      `apiDefault 要包 readonly({ … }) —— 沒包的話任何一次寫入都會改掉原始值,之後每次 reset 都還原成被改過的值,而且沒有徵兆`
    ),
  ]
}

// --- 規則 storeResetDefault:reset 不要手寫預設值 ----------------------------

/** apiData = { … } 的字面值賦值 */
const RESET_LITERAL_RE = /\.apiData\s*=\s*\{([^}]*)\}/g

const checkResetDefault = ({ rel, text }) => {
  if (!isActionsFile(rel)) return []

  return [...text.matchAll(RESET_LITERAL_RE)]
    .filter((m) => !/apiDefault/.test(m[1]))
    .map((m) =>
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'storeResetDefault',
        `reset 手寫了預設值 —— 改用 { ...store.apiDefault.{對應的 key} },預設值只留一份,改欄位時不會漏改這裡`
      )
    )
}

// --- 規則 storeToRefs:取 store 的值一律走 storeToRefs -----------------------
//
// pinia 的 store 實例是 reactive 物件,值一旦「取出來」就跟 store 斷了連結:
//
//   const member = useMemberStore()
//   const { info } = member          ← ❌ 解構,拿到的是當下的值
//   const info = member.info         ← ❌ 賦值,同樣是當下的值
//   const { info } = storeToRefs(member)   ← ✅ 拿到 ref,跟著 store 變
//
// 斷掉之後畫面不會報錯,只是**不再更新** —— api 回來了、別的頁面改了值,
// 這裡還是舊的。而且通常要等到「為什麼這裡沒跟著變」才被發現,
// 那時已經很難回想是哪一行取值的方式錯了。
//
// 例外(不算取值,照原樣使用):
//   - `$` 開頭的 pinia API:$patch / $reset / $subscribe / $state
//   - 寫入:`member.info = x` 是對的,只有「讀出來存成 const」才有問題
//   - `use*Actions()` 不是 store,那是一般 composable,直接解構就好

/** const <name> = useXxxStore() —— 找出這個檔案裡的 store 實例名 */
const STORE_INSTANCE_RE = /const\s+(\w+)\s*=\s*use\w+Store\s*\(\s*\)/g

/** const { a, b } = useXxxStore() —— 直接解構,一定失去響應 */
const STORE_DESTRUCTURE_RE = /const\s*\{[^}]*\}\s*=\s*use(\w+)Store\s*\(\s*\)/g

const checkStoreToRefs = ({ rel, text }) => {
  if (!isInSrc(rel)) return []
  if (!/\.(vue|js)$/.test(rel)) return []

  const issues = []

  for (const m of text.matchAll(STORE_DESTRUCTURE_RE)) {
    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'storeToRefs',
        `直接解構了 use${m[1]}Store() —— 取出來的是當下的值,之後 store 變了這裡不會跟著變;` +
          `改成 const { … } = storeToRefs(use${m[1]}Store())`
      )
    )
  }

  // 實例名先收集起來,再看有沒有「把它的屬性讀出來存成 const」
  const instances = [...text.matchAll(STORE_INSTANCE_RE)].map((m) => m[1])
  if (!instances.length) return issues

  for (const name of new Set(instances)) {
    // const x = member.info  ← 讀出來存成 const;$ 開頭是 pinia API,不算取值
    const readRe = new RegExp(`const\\s+(\\w+)\\s*=\\s*${name}\\.(?!\\$)(\\w+)`, 'g')

    for (const m of text.matchAll(readRe)) {
      // storeToRefs(member).xxx 這種寫法本身是對的
      if (/storeToRefs/.test(text.slice(Math.max(0, m.index - 40), m.index))) continue

      issues.push(
        issueOf(
          rel,
          lineNoOf(text, m.index),
          'storeToRefs',
          `${m[1]} 直接讀了 ${name}.${m[2]} —— 取出來就跟 store 斷了,之後 store 變了這裡不會更新;` +
            `改成 const { ${m[2]} } = storeToRefs(${name})`
        )
      )
    }
  }

  return issues
}

export const STORE_CHECKS = [
  checkStoreToRefs,
  checkStoreApiDefault,
  checkResetDefault,
  checkActionApiNaming,
  checkActionReturn,
  checkStoreDir,
  checkStoreDeclare,
  checkStoreNaming,
  checkStoreScope,
  checkActionsNaming,
  checkStoreLayer,
]

export const STORE_RULE_TITLE = {
  storeDir: 'store 資料夾命名',
  storeDeclare: 'store 裡寫了 function',
  storeNaming: 'store 的命名',
  storeScope: 'store 檔名對不上頁面資料夾',
  storeActions: 'actions 檔名',
  storeActionNaming: '呼叫 api 的 action 命名',
  storeActionReturn: 'action 的回傳形狀',
  storeApiDefault: '缺少 apiDefault',
  storeResetDefault: 'reset 手寫預設值',
  storeLayer: 'store 分層對不上頁面資料夾',
  storeToRefs: '取 store 的值沒走 storeToRefs',
}

export const STORE_RULE_HINT = {
  storeDir: '資料夾一律叫 stores',
  storeDeclare: `store 只放狀態宣告(computed 可以);行為放 ${ACTIONS_DIR}/use{名稱}Actions.js`,
  storeNaming: 'export const use{名稱}Store = defineStore(…)',
  storeScope: `${STORE_DIR} 的檔名要對得上 ${VIEWS_DIR} 的第一層資料夾`,
  storeActions: '檔名為 use{名稱}Actions.js',
  storeActionNaming: 'onApi + api 函式名 —— 從 action 名字看得出它打哪一支 api',
  storeActionReturn: '打了 api 的 action 一律 return { config, status, data }',
  storeApiDefault: '送出參數的預設值集中成 const apiDefault = readonly({ … })',
  storeResetDefault: 'reset 用 { ...store.apiDefault.xxx },不要手寫',
  storeLayer: `一個頁面一層;子資料夾只是分類時不佔一層,標豁免並寫理由`,
  storeToRefs: '取值一律 const { … } = storeToRefs(store) —— 直接解構或賦值會斷掉響應',
}
