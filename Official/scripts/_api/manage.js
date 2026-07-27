import { version, fetchManageApi } from '@js/_api/.config.js'

export const apiGetCommonServerTime = async (data) =>
  await fetchManageApi.get(`api/${version}/common/server-time`, data)

// 縣市選單
export const apiGETCitySelectOptions = async (data) =>
  await fetchManageApi.get(`api/${version}/buy/city/select-options`, data)

// 區域選單
export const apiGETDistrictSelectOptions = async (data) =>
  await fetchManageApi.get(`api/${version}/buy/{cityCode}/district/select-options`, data)

export const apiGETRealEstatePurposeCheckOptions = async (data) =>
  await fetchManageApi.get(`api/${version}/buy/realEstatePurpose/check-options`, data)

export const apiGETRealEstateTypeSelectOptions = async (data) =>
  await fetchManageApi.get(`api/${version}/buy/realEstateType/select-options`, data)

export const apiGETRealEstateFaceSelectOptions = async (data) =>
  await fetchManageApi.get(`api/${version}/buy/realEstateFace/select-options`, data)

export const apiGETRealEstateParkingModeSelectOptions = async (data) =>
  await fetchManageApi.get(`api/${version}/buy/realEstateParkingMode/select-options`, data)

export const apiGETRealEstateNearByCheckOptions = async (data) =>
  await fetchManageApi.get(`api/${version}/buy/realEstateNearBy/check-options`, data)

export const apiGETRealEstateFeatureCheckOptions = async (data) =>
  await fetchManageApi.get(`api/${version}/buy/realEstateFeature/check-options`, data)

export const apiGETBranchSelectOptions = async (data) =>
  await fetchManageApi.get(`api/${version}/buy/branch/select-options`, data)

export const apiGETBranchStoreSelectOptions = async (data) =>
  await fetchManageApi.get(`api/${version}/buy/branchStore/select-options`, data)
