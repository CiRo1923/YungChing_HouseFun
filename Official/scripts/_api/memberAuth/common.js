import { fetchApi } from '@js/_api/memberAuth/.config.js'

export const apiPostMemberAuthToken = async (data) => await fetchApi.post(`member/auth/token`, data)

export const apiGetMemberAuthHandoffToken = async (data) =>
  await fetchApi.get(`member/auth/handoff/token`, data)
