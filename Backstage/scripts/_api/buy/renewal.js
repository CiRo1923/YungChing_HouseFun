import { onFetchApi } from '@js/_api/export.js'

export const version = 'v1'

export const apiPOSTRealEstateReadToPublish = async (data) =>
  await onFetchApi.post(`api/${version}/buy/realEstate/ReadToPublish`, data)
