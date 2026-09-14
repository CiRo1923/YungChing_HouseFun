import { fetchManageApi } from '@js/_api/.config.js'

export const apiGetCommonServerTime = async (data) =>
  await fetchManageApi.get(`common/server-time`, data)

// 縣市選單
export const apiGETCitySelectOptions = async (data) =>
  await fetchManageApi.get(`buy/city/select-options`, data)

// 區域選單
export const apiGETDistrictSelectOptions = async (data) =>
  await fetchManageApi.get(`buy/{cityCode}/district/select-options`, data)

export const apiGETRealEstatePurposeCheckOptions = async (data) =>
  await fetchManageApi.get(`buy/realEstatePurpose/check-options`, data)

export const apiGETRealEstateTypeSelectOptions = async (data) =>
  await fetchManageApi.get(`buy/realEstateType/select-options`, data)

export const apiGETRealEstateFaceSelectOptions = async (data) =>
  await fetchManageApi.get(`buy/realEstateFace/select-options`, data)

export const apiGETRealEstateParkingModeSelectOptions = async (data) =>
  await fetchManageApi.get(`buy/realEstateParkingMode/select-options`, data)

export const apiGETRealEstateNearByCheckOptions = async (data) =>
  await fetchManageApi.get(`buy/realEstateNearBy/check-options`, data)

export const apiGETRealEstateFeatureCheckOptions = async (data) =>
  await fetchManageApi.get(`buy/realEstateFeature/check-options`, data)

export const apiGETBranchSelectOptions = async (data) =>
  await fetchManageApi.get(`buy/branch/select-options`, data)

export const apiGETBranchStoreSelectOptions = async (data) =>
  await fetchManageApi.get(`buy/branchStore/select-options`, data)
