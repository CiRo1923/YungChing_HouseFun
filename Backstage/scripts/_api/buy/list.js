import { fetchApi } from '@js/_api/.config.js'

export const apiGetVasCommonPlanAggregate = async (data) =>
  await fetchApi.get(`vas/Common/PlanAggregate`, data)

export const apiGetBuyRealEstateSearchFilter = async (data) =>
  await fetchApi.get(`buy/realEstate/searchFilter`, data)

export const apiGetBuyRealEstateCaseAggregate = async (data) =>
  await fetchApi.get(`buy/realEstate/caseAggregate`, data)

export const apiPostBuyRealEstateSearch = async (data) =>
  await fetchApi.post(`buy/realEstate/search`, data)

export const apiPostBuyRealEstateOffline = async (data) =>
  await fetchApi.post(`buy/realEstate/offline`, data)

export const apiPostBuyRealEstateDeal = async (data) =>
  await fetchApi.post(`buy/realEstate/deal`, data)

export const apiPostBuyRealEstateRemove = async (data) =>
  await fetchApi.post(`buy/realEstate/Remove`, data)

export const apiGetBuyRealEstateCaseViewCounts = async (data) =>
  await fetchApi.get(`buy/realEstate/caseViewCounts`, data)

export const apiGetBuyCommentsSearchCommentFilter = async (data) =>
  await fetchApi.get(`buy/Comments/SearchCommentFilter`, data)

export const apiPostBuyCommentsSearch = async (data) =>
  await fetchApi.post(`buy/Comments/Search`, data)

export const apiPostBuyCommentsUpdateReplyStatue = async (data) =>
  await fetchApi.post(`buy/Comments/UpdateReplyStatue`, data)
