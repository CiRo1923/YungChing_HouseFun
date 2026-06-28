import { version, fetchApi } from '@js/_api/fetchApi.js'

export const apiBuyHouse = async (data) =>
  await fetchApi.get(`api/${version}/buy/house/{hfid}`, data)

export const apiBuyHousePoi = async (data) =>
  await fetchApi.get(`api/${version}/buy/house/{hfid}/poi`, data)
