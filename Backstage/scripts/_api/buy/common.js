import { fetchApi, version } from '@js/_api/config.js'

// server 時間
export const apiGetCommonServerTime = async (data) =>
  await fetchApi.get(`api/${version}/common/server-time`, data)

// 縣市選單 (明細)
export const apiGETCitySelectOptions = async (data) =>
  await fetchApi.get(`api/${version}/buy/city/select-options`, data)

// 區域選單 (明細)
export const apiGETDistrictSelectOptions = async (data) =>
  await fetchApi.get(`api/${version}/buy/{cityCode}/district/select-options`, data)

// 查詢刊登方案 (列表 & 明細流程)
export const apiGetPublishAvailablePlans = async (data) =>
  await fetchApi.get(`api/${version}/vas/Publish/AvailablePlans`, data)

// 建立刊登 [單筆 / 批次] 刊登額度過期使用 (列表 & 明細流程)
export const apiPOSTPublishSubmit = async (data) =>
  await fetchApi.post(`api/${version}/vas/Publish/Submit`, data)

// 建立刊登 [單筆 / 批次] 刊登額度尚未過期使用 (列表 & 明細流程)
export const apiPOSTRealEstateRestoreToOnline = async (data) =>
  await fetchApi.post(`api/${version}/buy/realEstate/RestoreToOnline`, data)

// 物件續刊 [單筆 / 批次] (列表 & 明細流程)
export const apiPOSTPublishRenewal = async (data) =>
  await fetchApi.post(`api/${version}/vas/Publish/Renewal`, data)

// 查詢物件刊登狀態 (列表 & 明細流程)
export const apiGETPublishGetPublishResponse = async (data) =>
  await fetchApi.get(`api/${version}/vas/Publish/GetPublishResponse`, data)

// 黃金曝光方案 (列表 & 明細流程)
export const apiGETGoldenGetPlanList = async (data) =>
  await fetchApi.get(`api/${version}/vas/Golden/GetPlanList`, data)

// 單一物件 設定黃金曝光 (列表 & 明細流程)
export const apiPOSTGoldenSetPlanSingle = async (data) =>
  await fetchApi.post(`api/${version}/vas/Golden/SetPlanSingle`, data)

// 自動刷新設定 (列表 & 明細流程)
export const apiGETRefreshCurrentPlansForCase = async (data) =>
  await fetchApi.get(`api/${version}/vas/Refresh/CurrentPlansForCase`, data)

// 修改自動刷新時間 (列表 & 明細流程)
export const apiGETRefreshGetPlanInfo = async (data) =>
  await fetchApi.get(`api/${version}/vas/Refresh/GetPlanInfo`, data)

// 單一物件 設定自動刷新 (列表 & 明細流程)
export const apiPOSTRefreshSavePlan = async (data) =>
  await fetchApi.post(`api/${version}/vas/Refresh/SavePlan`, data)
