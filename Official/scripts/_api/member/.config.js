import { onFetchApi } from '@js/_api/.export.js'
import { onApiBaseURL } from '@js/_api/.config.js'

// Member BFF —— 會員中心的 API(auth 三支、menu、notifications、profile、subscriptions、compare)。
// 登入 / 註冊 / 升級 / 忘記密碼在另一個服務,見 scripts/_api/memberAuth/.config.js。
//
// baseURL 用函式延遲解析:onFetchApi 每次請求時才 resolveValue()。
// 避免在模組頂層呼叫 useRuntimeConfig()(context 外呼叫的反樣式;動態 import 時會警告),
// 改成每次請求在 request context 內取值,SSR / client 行為不變。
export const fetchApi = onFetchApi({
  baseURL: () =>
    onApiBaseURL(
      import.meta.dev && import.meta.client
        ? '/member/'
        : useRuntimeConfig().public.NUXT_PUBLIC_MEMBER_API_PATH
    ),
  credentials: 'include',
})

// 每次請求在 header 帶上這個服務自己的 accessToken(Bearer)。
// 它由 auth/token/exchange 簽發,與 buy BFF 的 token 各自獨立(兩邊都是 opaque token,
// 不能互用),所以取的是會員中心自己的 access 而不是 buy 的。
//
// X-Member-Id 是 notifications 那幾支的必填欄位(缺了回 400),值必須與 accessToken
// 所代表的身分相符 —— 取的是 auth/me 回傳的 memberId,那支與 token 出自同一次驗證。
// 兩個 header 都是有值才帶:auth/me 自己也會經過這裡,那時 userData 還是空的。
fetchApi.interceptors.request.use((fetchConfig) => {
  const memberCenter = useMemberCenterStore()
  const { access } = storeToRefs(memberCenter)
  const memberAuthProject = useMemberAuthProjectStore()
  const { userData } = storeToRefs(memberAuthProject)
  const accessToken = access.value.data?.accessToken
  const memberId = userData.value?.memberId

  if (accessToken) {
    fetchConfig.headers.Authorization = `Bearer ${accessToken}`
  }

  if (memberId) {
    fetchConfig.headers['X-Member-Id'] = memberId
  }

  return fetchConfig
})
