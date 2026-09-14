import { fetchApi } from '@js/_api/buy/.config.js'

export const apiGetBuyHouseHfid = async (data) => await fetchApi.get(`buy/house/{hfid}`, data)

export const apiGetBuyHouseHfidPoi = async (data) =>
  await fetchApi.get(`buy/house/{hfid}/poi`, data)
