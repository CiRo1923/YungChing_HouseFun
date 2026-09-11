// 終端機色碼。
//
// 非 TTY(編輯器輸出面板、CI log、被其他程式接管道)一律關色 ——
// 否則面板會印出一堆 [31m 之類的 ESC 亂碼。

// FORCE_COLOR=1 是給「輸出會被父行程轉印到終端機」的情境用的 ——
// dev server 外掛以子行程跑守門,子行程看不到 TTY,不強制的話永遠是黑白的。
// 編輯器的 Run on Save 面板不吃 ANSI,那邊就不要帶這個環境變數。
const on =
  process.env.FORCE_COLOR === '1' || (Boolean(process.stdout.isTTY) && !process.env.NO_COLOR)

export const RED = on ? '\x1b[31m' : ''
export const GREEN = on ? '\x1b[32m' : ''
export const YELLOW = on ? '\x1b[33m' : ''
export const CYAN = on ? '\x1b[36m' : ''
export const DIM = on ? '\x1b[2m' : ''
export const BOLD = on ? '\x1b[1m' : ''
export const RESET = on ? '\x1b[0m' : ''
