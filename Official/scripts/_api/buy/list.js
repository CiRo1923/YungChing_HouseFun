import { version, fetchApi } from '@js/_api/fetchApi.js'

export const apiBuyList = async (data) => await fetchApi.get(`api/${version}/buy/list`, data)

export const apiBuySuggest = async (data) => await fetchApi.get(`api/${version}/buy/suggest`, data)
