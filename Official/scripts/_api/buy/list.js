import { fetchApi } from '@js/_api/buy/.config.js'

export const apiGetBuyList = async (data) => await fetchApi.get(`buy/list`, data)

export const apiGetBuyListFocus = async (data) => await fetchApi.get(`buy/list/focus`, data)

export const apiGetBuySuggest = async (data) => await fetchApi.get(`buy/suggest`, data)
