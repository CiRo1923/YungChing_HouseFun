import { version, fetchApi } from '@js/_api/buy/.config.js'

export const apiAuthTokenExchange = async (data) =>
  await fetchApi.post(`api/${version}/buy/auth/token/exchange`, data)

export const apiAuthMe = async (data) => await fetchApi.get(`api/${version}/buy/auth/me`, data)

export const apiAuthLogout = async (data) =>
  await fetchApi.post(`api/${version}/buy/auth/logout`, data)

export const apiRegion = async (data) => await fetchApi.get(`api/${version}/region`, data)

export const apiMrt = async (data) => await fetchApi.get(`api/${version}/mrt`, data)

export const apiMessagesVerifyCode = async (data) =>
  await fetchApi.post(`api/${version}/buy/messages/verify-code`, data)

export const apiMessagesResendCode = async (data) =>
  await fetchApi.post(`api/${version}/buy/messages/resend-code`, data)

export const apiMessages = async (data) => await fetchApi.post(`api/${version}/buy/messages`, data)
