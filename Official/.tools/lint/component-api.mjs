#!/usr/bin/env node
// 元件的對外介面 —— 產生與比對。
//
//   node .tools/lint/component-api.mjs --write   重新產生(只有來源專案要做)
//   node .tools/lint/component-api.mjs           比對,多出來的列出來
//
// 元件是整套從元件庫複製過來的,它有四個對外的介面:
//
//   css 變數        使用端照著那幾個名字傳值,元件內部照著取值
//   config          使用端照著那幾個鍵傳設定,元件內部照著讀
//   defineExpose    使用端拿著它的 ref,照著那幾個名字直接呼叫
//   defineEmits     使用端照著那幾個名字綁 @事件
//
// **每個專案都可以把值改成自己的,但不可以自己多加。**
//
// 後兩種連值都沒得改:那兩份是名字本身 —— 改了名字、少了一個,
// 使用端那一行就對不上,而且 Vue 一聲都不會吭。
//
//   多加的那一個只有這個專案有,元件內部不會讀它 —— 寫了不會報錯,
//   什麼都不會發生,而下一個人會以為某個地方吃那個值。
//   下一次整套更新時它會被覆蓋掉,而覆蓋的當下沒有任何訊息。
//
// 真的需要一個新的變數或設定項時,那代表**元件本身要改**,回到元件庫去加 ——
// 加在那裡,每個專案都拿得到,而且元件內部真的會讀它。
//
// 只有這個專案要的樣式另外開一支(檔名帶 Project,見規則 projectStyleFile),
// 那一支裡面愛加什麼變數都可以 —— 它本來就不屬於來源。
//
// 為什麼記的是名單而不是雜湊:改值是允許的,所以雜湊一定對不上 ——
// 那會變成每個專案一裝上去就整片報,而一直報改不了的東西會讓整條被關掉。
// 名單只回答「有沒有多出來的名字」,改值不影響它。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  COMPONENT_DIRS,
  MODULE_CSS_DIR_NAME,
  VAR_DEFINE_RE,
  classPrefixOf,
  declaredEmitsOf,
  listFiles,
  maskComments,
  readSealedJson,
  toRel,
  writeSealedJson,
} from './shared.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')

/** 名單放這裡 —— 跟著元件一起複製到每個專案 */
export const COMPONENT_API_FILE = '.tools/lint/.component-api.json'

/**
 * 名單的 key 是怎麼算的 —— 寫進封存,讀的時候比對。
 *
 * 換過一次算法:原本用完整路徑,專案把元件再分一層類就全部對不上。
 * 沒有這個記號的話,舊名單配上新規則是「每一支都對不上」——
 * 而對不上的整支跳過,於是整條規則靜靜地變成零效果,結果還顯示通過。
 * 記下來才有辦法分出「名單是舊的」與「真的沒有多加東西」。
 */
const API_KEY_STYLE = 'component'

/**
 * 名單的 key —— 從元件自己那一層算起。
 *
 * 來源把元件平放在元件目錄底下,而專案常常在中間再加一層分類資料夾。
 * 那一層在來源不存在 —— 用完整路徑當 key 的話,那些專案的每一支都對不上,
 * 於是一條都不報。
 *
 * 從哪一層算起用的是既有的那份判斷(classPrefixOf:m 開頭接大寫才是元件資料夾),
 * 不自己再認一次 —— 兩份判斷有一天會不一樣,而不一樣的那天沒有人會發現。
 *
 * 認不出元件那一層時退回完整路徑:那不是這套命名裡的元件,
 * 硬切一段會讓兩支不相干的檔案共用同一個 key,比對的結果就是亂的。
 */
export const apiKeyOf = (rel) => {
  const segments = rel.split('/')
  const at = segments.findIndex((segment) => classPrefixOf(segment))

  return at < 0 ? rel : segments.slice(at).join('/')
}

/**
 * 這支 css 要不要列入名單。
 *
 * 只看元件自己的樣式目錄 —— 那一層是元件的介面。
 * 頁面與集中目錄的變數是各專案自己的東西,本來就該各自增減。
 *
 * 檔名帶 `Project` 的不列入:那是專案自己加的那一支,
 * 它的存在本身就是「這裡可以加東西」的意思(見規則 projectStyleFile)。
 */
export const isComponentVarFile = (rel) =>
  rel.endsWith('.css') &&
  rel.includes(`/${MODULE_CSS_DIR_NAME}/`) &&
  COMPONENT_DIRS.some((dir) => rel.startsWith(`${dir}/`)) &&
  !/Project(Variables)?\.css$/.test(rel)

/** 一支 css 裡定義了哪些變數(排序過,兩次產生的結果才比得出差異) */
const varNamesOf = (text) => [...new Set([...text.matchAll(VAR_DEFINE_RE)].map((m) => m[1]))].sort()

/**
 * config 的預設值寫在哪裡 —— 兩種形狀都要認。
 *
 *   export const defaultXxxConfig = { … }    設定集中在一支 composable 裡
 *   const config = computed(() => ({ … , ...props.config }))   寫在元件自己身上
 *
 * 只認其中一種的話,另一種形狀的元件整支不被檢查 ——
 * 而那不會報錯,只是那幾支的設定可以隨便加,沒有人會發現。
 */
const CONFIG_BLOCK_RE =
  /(?:export\s+)?const\s+(?:default\w*Config|config)\s*=\s*(?:computed\(\(\)\s*=>\s*\{?\s*(?:return\s*)?)?\{/g

/**
 * 一個物件字面值裡有哪些鍵 —— 巢狀的寫成 `父.子`。
 *
 * 逐字掃括號而不是用比對式:設定裡常常有巢狀物件(`schema: { value, label }`),
 * 而比對式分不出某一行屬於哪一層 —— 分錯層的話,巢狀那幾個鍵會被當成頂層的,
 * 於是「結構改了」看起來像「只是少了幾個鍵」。
 *
 * 從左大括號的下一個字開始掃,掃到它的配對為止。
 */
const keyPathsOf = (text, start) => {
  const out = []
  const stack = []

  let depth = 1
  let buf = ''
  let quote = null

  for (let i = start; i < text.length && depth > 0; i += 1) {
    const c = text[i]

    /* 引號裡的東西整段跳過。

       樣板字面值裡的 `${…}` 帶著大括號 —— 不跳過的話那個 `{` 會被當成
       進到了巢狀物件,配對從此全部錯開:那一行的鍵不會被記下來,
       而它後面那幾行會被算進錯的層。整支檔案的名單因此少了幾個名字,
       而少掉的那幾個從此可以隨便改,不會有人發現。 */
    if (quote) {
      if (c === '\\') {
        buf += c + (text[i + 1] ?? '')
        i += 1
        continue
      }

      if (c === quote) quote = null
      buf += c
      continue
    }

    if (c === '"' || c === "'" || c === '`') {
      quote = c
      buf += c
      continue
    }

    if (c === '{') {
      // 進到巢狀物件:剛剛那個鍵就是這一層的名字
      const key = buf.trim().match(/(\w+)\s*:\s*$/)?.[1]

      stack.push(key ?? '')
      depth += 1
      buf = ''
      continue
    }

    if (c === '}') {
      stack.pop()
      depth -= 1
      buf = ''
      continue
    }

    if (c === ',' || c === '\n') {
      const chunk = buf.trim()

      /* 兩種寫法都是鍵:`名字: 值`,以及只寫名字的簡寫(`{ inputRef, focus }`)。
         只認前者的話,整支用簡寫寫的那些介面一個都不會被記下來 ——
         名單看起來是空的,而「多加了一個」從此永遠比不出來。

         簡寫只在最外層認。函式的主體裡也會出現單獨一行的名字
         (`return x` 之類),在裡面認的話那些會被當成介面的一部分。 */
      const key =
        /^(\w+)\s*:/.exec(chunk)?.[1] ?? (!stack.length && /^\w+$/.test(chunk) ? chunk : null)

      if (key) out.push([...stack, key].filter(Boolean).join('.'))
      buf = ''
      continue
    }

    buf += c
  }

  return [...new Set(out)].sort()
}

/**
 * 元件交給使用端直接呼叫的那幾樣東西。
 *
 * 前面兩種介面是「傳進去」的(變數、設定),這一種是「拿出來用」的:
 * 使用端拿著元件的 ref,照著這幾個名字呼叫(`inputRef.value.focus()`)。
 *
 * 規矩與前兩種一樣,理由也一樣:專案在自己這一份多開一個,
 * 只有這個專案有 —— 下一次整套更新會把它覆蓋掉,而覆蓋的當下沒有訊息,
 * 使用端那一行從此呼叫一個不存在的東西。
 *
 * **與前兩種的差別是這一種連值都不能改。** 變數與設定留著讓各專案調,
 * 而這一種沒有「值」可調:名字改了、少了,使用端那一行就跟著壞。
 */
const EXPOSE_BLOCK_RE = /defineExpose\s*\(\s*\{/g

/** 一支檔案裡,某一種區塊宣告了哪些鍵 */
const blockKeysOf = (rel, raw, pattern) => {
  const text = maskComments(rel, raw)
  const out = []

  for (const m of text.matchAll(pattern)) {
    out.push(...keyPathsOf(text, m.index + m[0].length))
  }

  return [...new Set(out)].sort()
}

/**
 * 掃一次,回兩樣東西:名單本身,以及每個 key 現在是哪一支檔案。
 *
 * 名單要封存,所以裡面只有 key 與名字 —— 真實路徑因專案而異,
 * 寫進封存的話,光是把元件換一層資料夾就會讓名單對不上自己。
 * 而報違規時要指得到檔案,那時才需要路徑,所以另外回一份對照。
 */
const scanComponentApi = () => {
  const vars = {}
  const config = {}
  const expose = {}
  const emits = {}
  const files = {}

  for (const dir of COMPONENT_DIRS) {
    for (const abs of listFiles(root, dir)) {
      const rel = toRel(root, abs)
      const key = apiKeyOf(rel)

      if (isComponentVarFile(rel)) {
        const names = varNamesOf(fs.readFileSync(abs, 'utf8'))

        if (names.length) {
          vars[key] = names
          files[key] = rel
        }

        continue
      }

      if (!/\.(vue|js)$/.test(rel)) continue

      const raw = fs.readFileSync(abs, 'utf8')
      const configKeys = blockKeysOf(rel, raw, CONFIG_BLOCK_RE)
      const exposeKeys = blockKeysOf(rel, raw, EXPOSE_BLOCK_RE)

      /* 會發出的事件也是對外介面的一種 —— 使用端照著那幾個名字綁 @事件。
         判斷取共用的那一份(規則 componentEmits 用的也是它):
         兩邊各認一次的話,其中一邊多認一種寫法時,另一邊會開始講錯話。 */
      const emitNames = declaredEmitsOf(raw) ?? []

      if (configKeys.length) config[key] = configKeys
      if (exposeKeys.length) expose[key] = exposeKeys
      if (emitNames.length) emits[key] = [...emitNames].sort()
      if (configKeys.length || exposeKeys.length || emitNames.length) files[key] = rel
    }
  }

  return { api: { vars, config, expose, emits }, files }
}

/** 現在這些元件的介面長什麼樣 */
export const currentComponentApi = () => scanComponentApi().api

/** 封存下來的那一份;沒有檔案時回 null(還沒封存過的狀態) */
/* 讀取與寫入走共用的那一份 —— 兩種封存清單(共用規則的指紋、這一份名單)
   對「檔案不在或壞掉時怎麼辦」的答案必須一樣:一律不比對。
   各寫一次的話,其中一邊改了做法,另一邊還是舊的。 */
export const recordedComponentApi = () => {
  const json = readSealedJson(root, COMPONENT_API_FILE)
  if (!json) return null

  // 舊版的名單只有變數那一半,缺的那一邊當成空的,不要讓整個檢查停擺
  return {
    keyStyle: json.keyStyle ?? null,
    vars: json.vars ?? {},
    config: json.config ?? {},
    expose: json.expose ?? {},
    emits: json.emits ?? {},
  }
}

/**
 * 手上這份名單是不是舊算法產的。
 *
 * 是的話一支都比不出來 —— 每個 key 都對不上,而對不上的一律跳過。
 * 那與「沒有多加東西」在結果上長得一模一樣,所以要分開問:
 * 分不開的話,半套更新(規則換新的、名單還是舊的)會顯示通過。
 */
export const isStaleComponentApi = () => {
  const recorded = recordedComponentApi()

  return Boolean(recorded) && recorded.keyStyle !== API_KEY_STYLE
}

/**
 * 兩份名單之間多了哪些東西。
 *
 * 拆成純函式是為了讓規則自己的驗證直接驗這一份 ——
 * 這條規則在來源那邊是零效果(來源不比對自己),沒有辦法靠來源的檔案驗它;
 * 驗證那邊自己再寫一次比對的話,驗的就不是真正在跑的那段程式碼。
 *
 * **只看「多出來的」,不看少掉的。** 用不到的可以刪 ——
 * 那不會讓任何人誤會,元件內部讀不到時走的是它自己的預設。
 */
/**
 * 三種介面各自怎麼稱呼 —— 報訊息時要講得出是哪一種。
 *
 * 收在這裡一份,比對與規則兩邊共用:各寫一份的話,加第四種介面時
 * 只會改到其中一邊,而另一邊會把新的那一種講成「設定」。
 */
export const API_KIND_LABEL = {
  vars: '變數',
  config: '設定',
  expose: '對外呼叫的名字',
  emits: '會發出的事件',
}

export const diffComponentApi = (recorded, current) => {
  const out = []

  for (const kind of Object.keys(API_KIND_LABEL)) {
    for (const [file, names] of Object.entries(current[kind] ?? {})) {
      /* 來源沒有這一支檔案時整支跳過 —— 那是專案自己新增的元件,
         它的介面本來就全部是新的,報出來每一個都是誤報。 */
      const known = recorded[kind]?.[file]
      if (!known) continue

      const set = new Set(known)
      const added = names.filter((name) => !set.has(name))

      if (added.length) out.push({ kind, file, added })
    }
  }

  return out
}

/**
 * 這個專案在來源的元件介面上多加了什麼。
 *
 * 名單是舊算法產的就不比對(見 isStaleComponentApi)——
 * 比了也是每一支都對不上,報出來全是誤報。那個狀態由規則另外講。
 */
export const addedComponentApi = () => {
  const recorded = recordedComponentApi()
  if (!recorded || recorded.keyStyle !== API_KEY_STYLE) return []

  const { api, files } = scanComponentApi()

  /* 補上真實路徑 —— key 是來源那份的名字,少了專案自己的那幾層,
     報違規時照著它找不到檔案。 */
  return diffComponentApi(recorded, api).map((one) => ({ ...one, rel: files[one.file] ?? one.file }))
}

/* 直接執行才寫檔或比對 —— 被 import 時只提供上面那幾支,
   不做任何事。規則會在檢查時呼叫它們。 */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--write')) {
    const api = currentComponentApi()

    /* 算法記在名單裡 —— 讀的那一邊才分得出「名單是舊的」與「沒有多加東西」 */
    writeSealedJson(root, COMPONENT_API_FILE, { keyStyle: API_KEY_STYLE, ...api })
    console.log(
      `已更新 ${COMPONENT_API_FILE}(` +
        Object.entries(API_KIND_LABEL)
          .map(([kind, label]) => `${Object.keys(api[kind]).length} 支${label}`)
          .join('、') +
        ')'
    )
  } else if (isStaleComponentApi()) {
    console.error(
      `${COMPONENT_API_FILE} 是舊算法產的名單,這次沒有比對任何一支。` +
        '\n名單由規範工具的來源跑 npm run rules:seal 產生,跟著元件一起複製過來。'
    )
    process.exitCode = 1
  } else {
    const added = addedComponentApi()

    if (!added.length) {
      console.log('元件的介面沒有多出來的')
    } else {
      for (const { kind, file, added: names } of added) {
        console.log(`${file} 的${API_KIND_LABEL[kind]}多了:${names.join('、')}`)
      }

      process.exitCode = 1
    }
  }
}
