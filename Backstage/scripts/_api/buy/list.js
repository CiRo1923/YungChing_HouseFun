import { onFetchApi } from '@js/_api/export.js'

export const version = 'v1'

export const apiPOSTRealEstateSearch = async (data) =>
  await onFetchApi.post(`api/${version}/buy/realEstate/search`, data)

export const apiPOSTRealEstateOffline = async (data) =>
  await onFetchApi.post(`api/${version}/buy/realEstate/offline`, data)

export const apiPOSTRealEstateDeal = async (data) =>
  await onFetchApi.post(`api/${version}/buy/realEstate/deal`, data)
