import { onFetchApi } from '@js/_api/.export.js'

// baseURL 用函式延遲解析:onFetchApi 每次請求時才 resolveValue()。
// 避免在模組頂層呼叫 useRuntimeConfig()(context 外呼叫的反樣式;動態 import 時會警告),
// 改成每次請求在 request context 內取值,SSR / client 行為不變。
export const version = 'v1'

export const fetchApi = onFetchApi({
  baseURL: () =>
    import.meta.dev && import.meta.client
      ? '/buy/'
      : useRuntimeConfig().public.NUXT_PUBLIC_BUY_API_PATH,
  credentials: 'include',
})

// 每次請求在 header 帶上 memberProjct 的 accessToken(Bearer)。
fetchApi.interceptors.request.use((fetchConfig) => {
  const buyProject = useBuyProjectStore()
  const { access } = storeToRefs(buyProject)
  const accessToken = access.value.data?.accessToken

  if (accessToken) {
    fetchConfig.headers.Authorization = `Bearer ${accessToken}`
  }

  return fetchConfig
})
