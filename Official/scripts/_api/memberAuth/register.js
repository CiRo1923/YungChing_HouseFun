import { fetchApi } from '@js/_api/memberAuth/.config.js'

export const apiPostMemberAuthRegisterVerificationCode = async (data) =>
  await fetchApi.post(`member/auth/register/verification-code`, data)

export const apiPostMemberAuthRegister = async (data) =>
  await fetchApi.post(`member/auth/register`, data)
