// 規範工具唯一需要「知道專案目錄長什麼樣」的地方。
//
// 每個專案的資料夾擺法不一樣,把這些位置集中在這一支,
// 換一個專案時只改這裡,規則本身完全不用動。
//
// 注意:其他檔案不要再自己算專案根、也不要再拼一次快取路徑,一律 import 這裡的常數。
//     散在各處的話,改了一處忘了另一處,那條規則就靜靜失效 ——
//     不會報錯,只是從此不再檢查任何東西。

import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 專案根目錄。
 *
 * 這支檔案在 `.tools/lint/` 底下,所以往上三層才是專案根。
 * import 它的檔案不管放在哪一層都拿到同一個值 —— 這正是要集中的理由:
 * 各自用 `import.meta.url` 往上數層數時,層數寫錯就會指到別的地方,
 * 而那種錯誤只會表現成「檔案讀不到」,看不出是路徑算錯。
 */
export const PROJECT_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..')

/**
 * 存檔那層與對話那層之間的接力棒放在這裡。
 *
 * `.tools/lint/guard-file.mjs`(存檔時)把「剛存了哪些檔」寫進去,
 * `.claude/hooks/css-guard-prompt.js`(使用者送出訊息時)讀出來。
 *
 * 注意:兩邊的路徑一定要一致,對不上就等於接力棒斷了 ——
 *     **兩邊都不會報錯**,只是對話裡再也不會出現違規清單。
 *     所以這個值只有這裡一份。
 *
 * 放在 `node_modules/.cache/` 底下是刻意的:那裡不進版控。
 */
export const CACHE_DIR = path.join(PROJECT_ROOT, 'node_modules/.cache/css-guard')

/** 追蹤清單的檔名。存檔那層寫、對話那層讀 */
export const PENDING_FILE = path.join(CACHE_DIR, 'pending.json')
