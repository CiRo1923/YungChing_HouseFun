// CLI 輸出的顏色。
//
// **不是終端機就不要上色** —— VSCode 的輸出面板(Run on Save)、被程式接走的 stdout
// 都不支援 ANSI,硬印會變成一堆 `esc[31m` 的亂碼。
// 另外尊重慣例:NO_COLOR 環境變數與 --no-color 參數。

const isTTY = Boolean(process.stderr.isTTY && process.stdout.isTTY)
const wanted = !process.env.NO_COLOR && !process.argv.includes('--no-color')

export const useColor = isTTY && wanted

const code = (value) => (useColor ? value : '')

export const RED = code('\x1b[31m')
export const YELLOW = code('\x1b[33m')
export const GREEN = code('\x1b[32m')
export const CYAN = code('\x1b[36m')
export const DIM = code('\x1b[2m')
export const BOLD = code('\x1b[1m')
export const RESET = code('\x1b[0m')
