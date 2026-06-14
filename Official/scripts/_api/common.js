import { version, fetchApi } from '@js/_api/fetchApi.js'

export const apiRegion = async (data) => await fetchApi.get(`api/${version}/region`, data)

export const apiMrt = async (data) => await fetchApi.get(`api/${version}/mrt`, data)
