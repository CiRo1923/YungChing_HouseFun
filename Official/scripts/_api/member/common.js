import { version, fetchApi } from '@js/_api/member/.config.js'

// Member Auth 的 handoff token 換成這個服務專用的 bearer token。
//
// encryptedToken 走 query 而不是 body(這支與 buy 的 token/exchange 在這點上不同),
// 所以直接接在路徑後面 —— onFetchApi 對 POST 會把物件當 body 送。
export const apiAuthTokenExchange = async ({ encryptedToken }) =>
  await fetchApi.post(
    `api/${version}/auth/token/exchange?encryptedToken=${encodeURIComponent(encryptedToken)}`
  )

export const apiAuthMe = async (data) => await fetchApi.get(`api/${version}/auth/me`, data)

// 不帶參數,憑 bearer token 認人。撤銷的是 Member Auth 的全域 session,
// 所以其他頻道由同一個 session 派生的 token 也會一起失效。
export const apiAuthLogout = async (data) =>
  await fetchApi.post(`api/${version}/auth/logout`, data)
