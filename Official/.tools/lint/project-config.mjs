// 規範工具唯一需要「知道專案目錄長什麼樣」的地方。
//
// 每個專案的資料夾結構不一樣 —— 有的頁面放 src/views,有的放 pages;
// 有的 store 在 src/stores,有的在根目錄。把這些位置集中在這一支,
// 換一個專案時只改這裡,規則本身完全不用動。
//
// ⚠️ 規則檔案裡不要再寫死目錄路徑,一律 import 這裡的常數。
//    散在各處的話,換專案時漏改一支,那條規則就靜靜失效 —— 不會報錯,
//    只是從此不再檢查任何東西。

/** 頁面。api 檔名、store 檔名、store 分層都對照這個目錄的第一層資料夾 */
export const VIEWS_DIR = 'pages'

/** 狀態宣告 */
export const STORE_DIR = 'stores'

/** 行為(actions)。放在 store 目錄底下的這個子資料夾 */
export const ACTIONS_DIR_NAME = '.composables'

/** api 定義 */
export const API_DIR = 'scripts/_api'

/** 共用元件 */
export const COMPONENTS_DIR = 'components'

/**
 * 只放元件、不對應網址的目錄 —— **底下所有層級**都算,包含子資料夾。
 *
 * 這些目錄裡的 .vue 都是元件:它們被頁面放進畫面裡,自己不是一個網址。
 * 元件與頁面的規範不同(元件完全不能自己去要資料,頁面則是不建議),
 * 所以要分得出來。
 *
 * 目前列的三種都是「被放進畫面裡、自己不是網址」:共用元件、
 * 彈窗與廣告這類系統元件、版型。
 */
export const COMPONENT_DIRS = ['components', 'containers', 'layouts']

/**
 * 頁面目錄底下,這幾個資料夾裡的 .vue 也視為元件。
 *
 * 頁面目錄底下同時放著兩種東西:對應網址的頁面,以及只給那一頁用的元件。
 * 這份清單是用來指出後者的。
 *
 * **目前留空** —— 頁面目錄底下的元件套用頁面的規範(那條是建議級,不擋)。
 * 要讓它們也一律擋的話,把資料夾名加進來。
 *
 * ⚠️ 判斷只看資料夾名,不看檔名 —— 檔名看不出用途,
 *    同一個名字在不同專案可能是頁面也可能是元件。
 */
export const COMPONENT_FOLDERS = ['_components']

/** CSS 模組(每個模組一個子資料夾) */
export const CSS_MODULES_DIR = 'assets/css/_modules'

/**
 * 跨模組共用的尺寸級距變數放這一支(路徑相對 CSS 模組目錄)。
 *
 * 級距變數是「可以被父層覆寫的尺寸」,例如左右內距、圓角、高度。
 * 只有某一個模組會用到的,放那個模組自己的 ***Variables.css;
 * 兩個以上模組都要用的,才收進這一支。
 *
 * 換一個專案時,共用變數檔的位置可能不一樣 —— 改這裡就好,
 * 規則的提示訊息會跟著指向正確的檔案。
 */
export const SHARED_MODULE_VARIABLES = 'common/mForm/variables.css'

/** 色票檔所在目錄 */
export const COLOR_CSS_DIR = 'assets/css/_common'

/** 原始碼根目錄 */
export const SRC_DIR = ''

/**
 * 不對應任何頁面資料夾的 store 檔名。
 *
 * store 的檔名一般要對得上頁面目錄的第一層資料夾(有 `member` 頁面就有
 * `member` store)。這份清單是例外:它們是跨頁面的基礎建設,不屬於任何單一頁面。
 *
 * ⚠️ 加進來之前先想清楚「它為什麼不屬於任何一個頁面」——
 *    多半是彈窗、登入、靜態資料這類跨頁面的東西。
 *    想不出理由就是該歸到某個頁面底下,不要放這裡。
 *
 * 每個專案的基礎建設不一樣,所以這份清單放在設定裡,不寫在規則中。
 */
export const STANDALONE_STORES = [
  'common', // 跨頁面共用
  'project', // 全站層級
  'popup', // 彈窗系統
  'navs', // 導覽資料,跨頁面共用
  'index', // store 的彙總入口
  'manage', // 後端管理服務,不隸屬任何頁面
  'memberAuth', // 會員驗證流程(登入、註冊、升級),與 member 頁面分屬不同服務
]

/**
 * 不對應任何頁面資料夾的 api 檔名。
 *
 * api 的檔名一般要對得上頁面目錄的第一層資料夾,對不上的一律放共用的那一支
 * (檔名見下方 SHARED_API_FILE)。這份清單是暫時的例外。
 *
 * ⚠️ 不要往這裡加東西。對不上資料夾的 api 一律放共用那一支;
 *    清單裡留著的是還沒決定歸屬的檔案,處理完就清空。
 */
export const STANDALONE_APIS = [
  'manage', // 管理服務
  'memberAuth', // 會員驗證服務
]

/** 對不上任何頁面資料夾的 api 一律放這支(不含副檔名) */
export const SHARED_API_FILE = 'project'

/**
 * 頁面初次載入時,同時發出的多個請求要用哪一支函式包起來。
 *
 * 進入頁面時要拿的資料常常不只一份(列表、文案、會員狀態)。一支一支 await
 * 的話,第二支要等第一支回來才開始,使用者等的是每一支的時間加總;
 * 包在一起則是同時發出,等的是最慢的那一支。
 *
 * 兩個欄位:
 *   name    函式名稱
 *   source  它從哪裡來(自動補 import 時要用)
 *
 * 專案沒有這支共用函式時,把 name 設成空字串,那條規則會整條略過 ——
 * 檢查結果旁邊會列出「這條這次沒有作用」,不會安靜地顯示通過。
 */
export const PARALLEL_AWAIT_HELPER = {
  name: 'awaitAllPromise',
  source: '@js/_prototype.js',
}

/**
 * 本專案自己的名稱 —— 這幾種寫法出現在程式碼或文件裡就是違規。
 *
 * 名稱寫進去之後,那份檔案就只能待在這個專案:共用元件複製到別的專案要逐行改,
 * 搬過去忘了改就變成錯的敘述(規範文件、提示訊息尤其容易),
 * 而且從內容看不出哪幾句是「本專案限定」。
 * 網域、路徑、識別字一律走環境變數或設定檔。
 *
 * ⚠️ **只填本專案自己的名稱。**
 *    不要把別的專案名稱列進來 —— 那等於把別人的專案名寫死在這裡,
 *    正好是這條規則要防的事;而且這份設定會跟著專案複製出去。
 *
 * 換專案時把這裡換成新專案的名稱。留著舊名稱的話,這條規則會去抓一個
 * 與新專案無關的字,而新專案自己的名稱反而不會被抓。
 */
export const PROJECT_NAME_PATTERNS = [
  // 前面卡「不是英文字母」是必要的 —— 少了它,in-house(自製)這種正常的英文字會被當成專案名
  /(?<![a-z])house[\s_-]?fun/i, // 本專案(套件設定的 name、資料夾名)
  /(?<![a-z])yung[\s_-]?ching/i, // 上層目錄名
]

/**
 * 被 tailwind 設定「整組覆寫」掉、實際上不存在的 class。
 *
 * tailwind 的 theme 設定分兩種寫法:寫在 `extend` 底下是「補充」,
 * 內建的值都還在;直接寫在 `theme` 底下是「整組覆寫」——
 * 那一類的內建值會全部消失。消失之後在畫面上寫那些 class 不會報錯,
 * 但產不出任何 CSS,樣式就是沒有效果,而且很難查。
 *
 * 每一項的意思:
 *   dead       被覆寫掉、已經不存在的內建值 —— 用到就提醒
 *   available  覆寫之後實際可用的值 —— 寫進提示訊息,讓看到的人知道該改用什麼
 *
 * **這份設定要跟著專案的 tailwind 設定走。** 沒有整組覆寫的類別,
 * `dead` 留空陣列就好(那一類不會有任何提醒)。
 * 專案改了 tailwind 的 theme 設定時,這裡要跟著更新 ——
 * 沒更新的話,規則會提醒實際上存在的 class,或漏掉實際上已消失的 class。
 *
 * 目前的情形:screens、fontSize、boxShadow 三類是整組覆寫;
 * fontFamily 沒有覆寫,所以 font-sans / font-serif / font-mono 正常可用,不列入。
 */
export const TAILWIND_THEME_OVERRIDES = {
  /** 斷點前綴,寫法是 `斷點:class` */
  screens: {
    label: '斷點',
    dead: ['sm', 'md', 'lg', 'xl', '2xl'],
    available: [
      'm',
      't',
      'tm',
      'pt',
      'p',
      'pMin',
      'pMax',
      'mLandscape',
      'notsupport',
      'firefox',
      'IE',
    ],
  },

  /** 字體,寫法是 `font-值` */
  fontFamily: {
    label: '字體',
    prefix: 'font-',
    dead: ['sans', 'serif', 'mono'],
    available: ['default'],
  },

  /** 字級,寫法是 `text-值` */
  fontSize: {
    label: '字級',
    prefix: 'text-',
    dead: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'],
    available: ['vmp', 'vmt', 'vmm', 'vmmls'],
  },

  /**
   * 陰影,寫法是 `shadow-值`。
   *
   * available 是空的 —— 本專案沒有任何 shadow preset。
   * 陰影一律走模組自己的變數加原生 box-shadow:preset 的值必定帶色碼
   * (那會繞過色票檔),而且無法分斷點。
   */
  boxShadow: {
    label: '陰影',
    prefix: 'shadow-',
    dead: ['sm', 'md', 'lg', 'xl', '2xl', 'inner', 'none'],
    available: [],
  },
}

/**
 * 會被檢查的副檔名 —— 五層守門(編輯器存檔、開發伺服器、AI 寫檔、對話提醒、commit)
 * 用的是同一份範圍。
 *
 * ⚠️ 少列一種,那種檔案就完全不會被檢查,而且不會有任何徵兆。
 *    api、store、actions 都是 .js;規範文件、skills 與說明文件都是 .md ——
 *    漏掉哪一種,那一整區就沒有守門。
 *
 * `.md` 進來之後生效的是「不寫專案名稱」與「不寫絕對路徑」這兩條:
 * 那些檔案會整批複製到下一個專案,寫死名稱或某台機器的路徑,搬過去就是錯的敘述。
 * 其餘規則(css、api、store、頁面)都有自己的副檔名或路徑條件,不會誤判 .md。
 *
 * ⚠️ 有兩個地方沒辦法 import 這份設定,改動時要一起改:
 *      .githooks/pre-commit          commit 時篩選檔案的 grep
 *      .vscode/settings.json         編輯器存檔時觸發的 match
 *    兩處都寫了註解指向這裡。
 */
export const SCANNABLE_EXTENSIONS = ['vue', 'css', 'js', 'mjs', 'cjs', 'md']

export const SCANNABLE_RE = new RegExp(`\\.(${SCANNABLE_EXTENSIONS.join('|')})$`, 'i')

/**
 * 專案自己的文件目錄 —— **每一條規則都不檢查這裡**。
 *
 * 這一層放的是寫給這個專案的文件:規格、對照表、會議紀錄那類。
 * 它們是內容本身,不是程式碼也不是規範 —— 提到專案名稱、貼一段實際路徑、
 * 引用一段不合規範的範例程式碼都是正常的,拿規則去檢查只會產生整片誤報,
 * 而誤報多到一個程度,整份清單就會被當成雜訊略過。
 *
 * 位置與名稱在每個專案都一樣(專案根底下的 `docs`),所以不列為
 * 「換專案要改的設定」—— 直接固定在這裡。
 *
 * 規範系統自己的說明文件不放這裡,放在 `.claude/docs/`,照樣受規則檢查:
 * 那些會整批複製到下一個專案,寫死名稱或路徑搬過去就是錯的敘述。
 */
export const PROJECT_DOCS_DIR = 'docs'

/**
 * 規範系統自己所在的目錄 —— 檢查工具、給 AI 讀的規範(含它的說明文件)、
 * 開發伺服器外掛、commit 前的檢查。
 *
 * 這些目錄裡的檔案不是原始碼,api、store、頁面那幾類規則不適用於它們;
 * 但它們會整批複製到下一個專案,所以「不寫專案名稱」這條只管這裡。
 *
 * ⚠️ 全專案掃描的範圍與規則的適用範圍都由這份清單長出來,不要分開維護 ——
 *    兩邊不一致的話,規則會宣告自己管某個目錄,但預設掃描根本不走訪它,
 *    那個目錄就等於沒有被檢查過。
 */
const TOOLING_DIRS = ['.claude', '.tools', '.vite', '.githooks']

/** 給 AI 助理讀的設定目錄 —— 底下放跨規則的共同前提、各類寫法規範、各個 hook */
const AI_CONFIG_DIR = '.claude'

/**
 * 跨規則的共同前提(判斷不出來就問、規範不能有兩份、治根、文字怎麼寫)。
 *
 * 這裡只定義位置。**有哪幾份、各自講什麼、優先順序是幾** 一律從檔案自己的
 * frontmatter 讀出來,不在任何地方另外列一份清單 —— 列了就會有跟目錄對不上的
 * 一天,而對不上的時候不會報錯,只是新增的那份規則從此沒有人看得到。
 */
export const CONVENTION_RULES_DIR = `${AI_CONFIG_DIR}/rules`

/** 各類程式的寫法規範,一個資料夾一份,裡面是 SKILL.md */
export const CONVENTION_SKILLS_DIR = `${AI_CONFIG_DIR}/skills`

/**
 * 原始碼放在專案根目錄時,SRC_DIR 會是空字串或 `.`(Nuxt 那種擺法:
 * pages、stores、components 都直接放在專案根,沒有 src 這一層)。
 *
 * 那時「這個檔案是不是原始碼」不能靠前綴比對 —— 前綴是空的,比對永遠不成立,
 * 一整批規則會靜靜地不再檢查任何東西。改成反過來認:
 * 不在規範系統那幾個目錄底下的,就是原始碼。
 */
export const IS_SRC_PROJECT_ROOT = !SRC_DIR || SRC_DIR === '.'

/** 原始碼的路徑前綴;原始碼就放在專案根時是 null(那時改用排除法判斷) */
export const SRC_PREFIX = IS_SRC_PROJECT_ROOT ? null : `${SRC_DIR}/`

/** 規範系統自己那幾個目錄的路徑前綴 */
export const TOOLING_PREFIXES = TOOLING_DIRS.map((dir) => `${dir}/`)

/**
 * 全專案掃描時走訪的目錄。
 *
 * 原始碼就放在專案根時走訪整個專案(掃描本身會跳過 node_modules、
 * 建置產物那些),否則只走訪原始碼目錄與規範系統的目錄。
 */
export const SCAN_TARGETS = IS_SRC_PROJECT_ROOT ? ['.'] : [SRC_DIR, ...TOOLING_DIRS]

/**
 * 規則 `projectName`(不寫死專案名稱)的適用範圍(路徑前綴)。
 *
 * **只管規範系統自身** —— 檢查工具、skills、hooks、規範自己的說明文件。
 * 那些檔案會整批複製到下一個專案,裡面寫死名稱的話,搬過去就是錯的敘述,
 * 而且從內容看不出哪幾句是「本專案限定」。
 *
 * 原始碼不在範圍內。頁面標題、頁尾品牌名、會員條款裡的品牌名稱是內容本身,
 * 不是被寫死的設定 —— 那些檔案不會複製到別的專案,寫出品牌名是正確的。
 * 把原始碼也納入的話,整份清單會被大量正當文案淹沒,真正該擋的那幾筆反而看不到。
 *
 * 原始碼放在專案根的擺法(Nuxt 那種)也走同一份前綴,兩種擺法行為一致。
 */
export const PROJECT_NAME_SCOPE = TOOLING_PREFIXES

/**
 * 規則 `absolutePath`(不寫某一台機器上的路徑)的適用範圍(路徑前綴)。
 *
 * **涵蓋原始碼與規範系統自身。** 絕對路徑跟品牌名稱不一樣:它不是內容,
 * 是只在某一台開發機上成立的位置 —— 別人 clone 下來直接壞掉,build 也不會過。
 * 寫在原始碼裡同樣是錯的,所以範圍不限縮。
 *
 * 原始碼就放在專案根時,範圍是整個專案(空字串前綴對任何路徑都成立)。
 */
export const ABSOLUTE_PATH_SCOPE = IS_SRC_PROJECT_ROOT
  ? ['']
  : [SRC_PREFIX, ...TOOLING_PREFIXES]

/**
 * 建置設定檔的候選檔名 —— 由前往後找,用第一個存在的那一支。
 *
 * 「離開自己資料夾要用 alias」那條規則需要知道專案有哪些 alias,
 * 而 alias 只有建置設定知道。不同工具的設定檔叫不同名字(Vite 是
 * vite.config.js,Nuxt 是 nuxt.config.ts),也可能寫成 .ts 或 .mjs,
 * 所以列成候選清單,而不是寫死一個檔名。
 *
 * 讀的是設定裡 `'@名稱': '對應路徑'` 這種形狀,不管它放在 resolve.alias
 * 還是 alias 底下都認得,所以同一份解析可以共用給不同建置工具。
 *
 * ⚠️ 一支都找不到時,那條規則會被略過(不會報錯,也不會誤報)。
 *    工具啟動時會把「因為缺什麼而沒有作用」列出來,不會安靜地失效。
 */
export const BUILD_CONFIG_FILES = [
  'nuxt.config.ts',
  'nuxt.config.js',
  'vite.config.js',
  'vite.config.ts',
  'vite.config.mjs',
  'webpack.config.js',
]

/**
 * 專案設定檔的候選檔名 —— 由前往後找,用第一個存在的那一支。
 *
 * 建置設定裡的 alias 路徑有時帶變數(例如 `src/${CONFIG.fonts}`),
 * 那些值定義在專案設定檔。找不到這支檔案時,帶變數的那幾條 alias 會被跳過,
 * 其餘照常運作。
 */
export const PROJECT_CONFIG_FILES = ['config.js', 'config.mjs', 'config.ts']
