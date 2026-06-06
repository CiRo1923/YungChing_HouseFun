import { fetchApi, version } from '@js/_api/config.js'

export const apiGETCommonPlanAggregate = async (data) =>
  await fetchApi.get(`api/${version}/vas/Common/PlanAggregate`, data)

export const apiGETRealEstateSearchFilter = async (data) =>
  await fetchApi.get(`api/${version}/buy/realEstate/searchFilter`, data)

export const apiPOSTRealEstateCaseAggregate = async (data) =>
  await fetchApi.get(`api/${version}/buy/realEstate/caseAggregate`, data)

export const apiPOSTRealEstateSearch = async (data) =>
  await fetchApi.post(`api/${version}/buy/realEstate/search`, data)

export const apiPOSTRealEstateOffline = async (data) =>
  await fetchApi.post(`api/${version}/buy/realEstate/offline`, data)

export const apiPOSTRealEstateDeal = async (data) =>
  await fetchApi.post(`api/${version}/buy/realEstate/deal`, data)

export const apiPOSTRealEstateRemove = async (data) =>
  await fetchApi.post(`api/${version}/buy/realEstate/Remove`, data)

export const apiGETRealEstateCaseViewCounts = async (data) =>
  await fetchApi.get(`api/${version}/buy/realEstate/caseViewCounts`, data)

export const apiGETCommentssearchCommentFilter = async (data) =>
  await fetchApi.get(`api/${version}/buy/Comments/SearchCommentFilter`, data)

export const apiPOSTCommentsSearch = async (data) =>
  await fetchApi.post(`api/${version}/buy/Comments/Search`, data)

export const apiPOSTCommentsUpdateReplyStatue = async (data) =>
  await fetchApi.post(`api/${version}/buy/Comments/UpdateReplyStatue`, data)
