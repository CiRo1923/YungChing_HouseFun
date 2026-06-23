import { version, fetchManageApi } from '@js/_api/fetchApi.js'

export const apiGetCommonServerTime = async (data) =>
  await fetchManageApi.get(`api/${version}/common/server-time`, data)

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
