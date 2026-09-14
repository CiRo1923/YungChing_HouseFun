import { fetchApi } from '@js/_api/.config.js'

// server 時間
export const apiGetCommonServerTime = async (data) => await fetchApi.get(`common/server-time`, data)

// 縣市選單 (明細)
export const apiGetBuyCitySelectOptions = async (data) =>
  await fetchApi.get(`buy/city/select-options`, data)

// 區域選單 (明細)
export const apiGetBuyCityCodeDistrictSelectOptions = async (data) =>
  await fetchApi.get(`buy/{cityCode}/district/select-options`, data)

// 查詢刊登方案 (列表 & 明細流程)
export const apiGetVasPublishAvailablePlans = async (data) =>
  await fetchApi.get(`vas/Publish/AvailablePlans`, data)

// 建立刊登 [單筆 / 批次] 刊登額度過期使用 (列表 & 明細流程)
export const apiPostVasPublishSubmit = async (data) =>
  await fetchApi.post(`vas/Publish/Submit`, data)

// 建立刊登 [單筆 / 批次] 刊登額度尚未過期使用 (列表 & 明細流程)
export const apiPostBuyRealEstateRestoreToOnline = async (data) =>
  await fetchApi.post(`buy/realEstate/RestoreToOnline`, data)

// 物件續刊 [單筆 / 批次] (列表 & 明細流程)
export const apiPostVasPublishRenewal = async (data) =>
  await fetchApi.post(`vas/Publish/Renewal`, data)

// 查詢物件刊登狀態 (列表 & 明細流程)
export const apiGetVasPublishGetPublishResponse = async (data) =>
  await fetchApi.get(`vas/Publish/GetPublishResponse`, data)

// 黃金曝光方案 (列表 & 明細流程)
export const apiGetVasGoldenGetPlanList = async (data) =>
  await fetchApi.get(`vas/Golden/GetPlanList`, data)

// 單一物件 設定黃金曝光 (列表 & 明細流程)
export const apiPostVasGoldenSetPlanSingle = async (data) =>
  await fetchApi.post(`vas/Golden/SetPlanSingle`, data)

// 自動刷新設定 (列表 & 明細流程)
export const apiGetVasRefreshCurrentPlansForCase = async (data) =>
  await fetchApi.get(`vas/Refresh/CurrentPlansForCase`, data)

// 新增自動刷新時間 (列表 & 明細流程)
export const apiGetVasRefreshNewPlan = async (data) => await fetchApi.get(`vas/Refresh/NewPlan`, data)

// 修改自動刷新時間 (列表 & 明細流程)
export const apiGetVasRefreshGetPlanInfo = async (data) =>
  await fetchApi.get(`vas/Refresh/GetPlanInfo`, data)

// 自動刷新選擇額度 (列表 & 明細流程)
export const apiGetVasRefreshAvailablePlans = async (data) =>
  await fetchApi.get(`vas/Refresh/AvailablePlans`, data)

// 單一物件 自動刷新儲存 (列表 & 明細流程)
export const apiPostVasRefreshSavePlan = async (data) =>
  await fetchApi.post(`vas/Refresh/SavePlan`, data)

// 自動刷新範本設定 (列表 & 明細流程)
export const apiGetVasRefreshTemplateAvailableTemplates = async (data) =>
  await fetchApi.get(`vas/Refresh/Template/AvailableTemplates`, data)

// 取得自動刷新範本時間 (列表 & 明細流程)
export const apiGetVasRefreshTemplateGetTemplateInfo = async (data) =>
  await fetchApi.get(`vas/Refresh/Template/GetTemplateInfo`, data)

// 單一物件 自動刷新範本時間儲存 (列表 & 明細流程)
export const apiPostVasRefreshTemplateSaveTemplate = async (data) =>
  await fetchApi.post(`vas/Refresh/Template/SaveTemplate`, data)

// 單一物件 自動刷新範本儲存 (列表 & 明細流程)
export const apiPostVasRefreshSavePlanTemplate = async (data) =>
  await fetchApi.post(`vas/Refresh/SavePlan/template`, data)
