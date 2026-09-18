import { fetchApi } from '@js/_api/member/.config.js'

// Member Auth 的 handoff token 換成這個服務專用的 bearer token。
//
// encryptedToken 走 query 而不是 body(這支與 buy 的 token/exchange 在這點上不同),
// 所以寫成 {key} 放在 query 位置 —— onFetchApi 會把它從參數物件填進網址,
// 填過的 key 不再進 body,POST 的物件才不會把同一個值送第二次。
export const apiPostAuthTokenExchange = async (data) =>
  await fetchApi.post(`auth/token/exchange?encryptedToken={encryptedToken}`, data)

export const apiGetAuthMe = async (data) => await fetchApi.get(`auth/me`, data)

// 不帶參數,憑 bearer token 認人。撤銷的是 Member Auth 的全域 session,
// 所以其他頻道由同一個 session 派生的 token 也會一起失效。
export const apiPostAuthLogout = async (data) => await fetchApi.post(`auth/logout`, data)
