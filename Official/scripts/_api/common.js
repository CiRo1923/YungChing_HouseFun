import { version, onFetchBasicApi } from '@js/_api/fetchApi.js'

export const apiRegion = async (data) => await onFetchBasicApi('get', `api/${version}/region`, data)

export const apiMrt = async (data) => await onFetchBasicApi('get', `api/${version}/mrt`, data)
