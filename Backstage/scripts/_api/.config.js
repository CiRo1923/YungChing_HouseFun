import { onFetchApi } from '@js/_api/.export.js'

export const version = 'v1'

/**
 * 所有端點共同的前綴。併進 baseURL 而不是寫在每一支 api 的路徑裡 ——
 * 那樣函式名(api + Method + endpoint 各段)才會對得上真正的端點,
 * 不會每一支都多出一段 Version。
 *
 * 去掉結尾斜線再接,dev 的 '/' 與正式的 'https://…' 兩種都不會多一條斜線。
 */
export const onApiBaseURL = (base) => `${String(base).replace(/\/+$/, '')}/api/${version}`

// baseURL 用函式延遲解析:onFetchApi 每次請求時才 resolveValue()。
// 避免在模組頂層呼叫 useRuntimeConfig()(context 外呼叫的反樣式;動態 import 時會警告),
// 改成每次請求在 request context 內取值,SSR / client 行為不變。
export const fetchApi = onFetchApi({
  baseURL: () =>
    onApiBaseURL(
      import.meta.dev && import.meta.client ? '/' : useRuntimeConfig().public.NUXT_PUBLIC_API_PATH
    ),
})
