import { version, fetchApi } from '@js/_api/member/.config.js'

export const apiAuthToken = async (data) =>
  await fetchApi.post(`api/${version}/member/auth/token`, data)

export const apiAuthHandoffToken = async (data) =>
  await fetchApi.get(`api/${version}/member/auth/handoff/token`, data)
