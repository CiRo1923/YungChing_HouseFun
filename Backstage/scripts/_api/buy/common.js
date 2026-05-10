import { onFetchApi } from '@js/_api/export.js'

export const version = 'v1'

export const apiGETCitySelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/city/select-options`, data)

export const apiGETDistrictSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/{cityCode}/district/select-options`, data)

// 列表 & 明細流程 都用的到
export const apiGetPublishAvailablePlans = async (data) =>
  await onFetchApi.get(`api/${version}/vas/Publish/AvailablePlans`, data)

// 列表 & 明細流程 都用的到
export const apiPOSTPublishSubmit = async (data) =>
  await onFetchApi.post(`api/${version}/vas/Publish/Submit`, data)

// 列表 & 明細流程 都用的到
export const apiPOSTPublishRenewal = async (data) =>
  await onFetchApi.post(`api/${version}/vas/Publish/Renewal`, data)

// 列表 & 明細流程 都用的到
export const apiPOSTPublishGetPublishResponse = async (data) =>
  await onFetchApi.get(`api/${version}/vas/Publish/GetPublishResponse`, data)
