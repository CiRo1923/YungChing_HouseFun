import { fetchApi } from '@js/_api/buy/.config.js'

export const apiPostBuyAuthTokenExchange = async (data) =>
  await fetchApi.post(`buy/auth/token/exchange`, data)

export const apiGetBuyAuthMe = async (data) => await fetchApi.get(`buy/auth/me`, data)

export const apiPostBuyAuthLogout = async (data) => await fetchApi.post(`buy/auth/logout`, data)

export const apiGetRegion = async (data) => await fetchApi.get(`region`, data)

export const apiGetMrt = async (data) => await fetchApi.get(`mrt`, data)

export const apiPostBuyMessagesVerifyCode = async (data) =>
  await fetchApi.post(`buy/messages/verify-code`, data)

export const apiPostBuyMessagesResendCode = async (data) =>
  await fetchApi.post(`buy/messages/resend-code`, data)

export const apiPostBuyMessages = async (data) => await fetchApi.post(`buy/messages`, data)
