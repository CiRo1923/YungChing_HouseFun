import { onFetchApi } from '@js/_api/.export.js'

// baseURL 用函式延遲解析:onFetchApi 每次請求時才 resolveValue()。
// 避免在模組頂層呼叫 useRuntimeConfig()(context 外呼叫的反樣式;動態 import 時會警告),
// 改成每次請求在 request context 內取值,SSR / client 行為不變。
export const version = 'v1'
export const fetchApi = onFetchApi({
  baseURL: () =>
    import.meta.dev && import.meta.client ? '/' : useRuntimeConfig().public.NUXT_PUBLIC_API_PATH,
})
export const fetchManageApi = onFetchApi({
  baseURL: () =>
    import.meta.dev && import.meta.client
      ? '/manage/'
      : useRuntimeConfig().public.NUXT_PUBLIC_MANAGE_API_PATH,
})
