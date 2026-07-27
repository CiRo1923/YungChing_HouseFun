import { version, fetchApi } from '@js/_api/member/.config.js'

export const apiAuthRegisterVerificationCode = async (data) =>
  await fetchApi.post(`api/${version}/member/auth/register/verification-code`, data)

export const apiAuthRegister = async (data) =>
  await fetchApi.post(`api/${version}/member/auth/register`, data)
