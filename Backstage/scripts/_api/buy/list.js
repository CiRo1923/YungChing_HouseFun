import { onFetchApi } from '@js/_api/export.js'

export const version = 'v1'

export const apiPOSTRealEstateSearch = async (data) =>
  await onFetchApi.post(`api/${version}/buy/realEstate/search`, data)

export const apiGetVasPublishAvailablePlans = async (data) =>
  await onFetchApi.get(`api/${version}/vas/Publish/AvailablePlans`, data)
