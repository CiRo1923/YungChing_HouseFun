import { version, onFetchBasicApi } from '@js/_api/fetchApi.js'

export const apiBuyList = async (data) =>
  await onFetchBasicApi('get', `api/${version}/buy/list`, data)
