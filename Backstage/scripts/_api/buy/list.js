import { fetchApi, version } from '@js/_api/config.js'

export const apiPOSTRealEstateCaseAggregate = async (data) =>
  await fetchApi.get(`api/${version}/buy/realEstate/caseAggregate`, data)

export const apiPOSTRealEstateSearch = async (data) =>
  await fetchApi.post(`api/${version}/buy/realEstate/search`, data)

export const apiPOSTRealEstateOffline = async (data) =>
  await fetchApi.post(`api/${version}/buy/realEstate/offline`, data)

export const apiPOSTRealEstateDeal = async (data) =>
  await fetchApi.post(`api/${version}/buy/realEstate/deal`, data)
