import { onFetchApi } from '@js/_api/export.js'

export const version = 'v1'

// 縣市選單 (明細)
export const apiGETCitySelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/city/select-options`, data)

// 區域選單 (明細)
export const apiGETDistrictSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/{cityCode}/district/select-options`, data)

// 查詢刊登方案 (列表 & 明細流程)
export const apiGetPublishAvailablePlans = async (data) =>
  await onFetchApi.get(`api/${version}/vas/Publish/AvailablePlans`, data)

// 建立刊登 [單筆 / 批次] 刊登額度過期使用 (列表 & 明細流程)
export const apiPOSTPublishSubmit = async (data) =>
  await onFetchApi.post(`api/${version}/vas/Publish/Submit`, data)

// 建立刊登 [單筆 / 批次] 刊登額度尚未過期使用 (列表 & 明細流程)
export const apiPOSTRealEstateRestoreToOnline = async (data) =>
  await onFetchApi.post(`api/${version}/buy/realEstate/RestoreToOnline`, data)

// 物件續刊 [單筆 / 批次] (列表 & 明細流程)
export const apiPOSTPublishRenewal = async (data) =>
  await onFetchApi.post(`api/${version}/vas/Publish/Renewal`, data)

// 查詢物件刊登狀態 (列表 & 明細流程)
export const apiGETPublishGetPublishResponse = async (data) =>
  await onFetchApi.get(`api/${version}/vas/Publish/GetPublishResponse`, data)

// 黃金曝光方案 (列表 & 明細流程)
export const apiGETGoldenGetPlanList = async (data) =>
  await onFetchApi.get(`api/${version}/vas/Golden/GetPlanList`, data)

// 單一物件 設定黃金曝光 (列表 & 明細流程)
export const apiPOSTGoldenSetPlanSingle = async (data) =>
  await onFetchApi.post(`api/${version}/vas/Golden/SetPlanSingle`, data)
