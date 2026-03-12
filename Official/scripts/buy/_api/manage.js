import { version, onFetchManageApi } from '@js/_api/fetchApi.js'

export const apiGETCitySelectOptions = async (data) =>
  await onFetchManageApi('get', `api/${version}/buy/city/select-options`, data)

export const apiGETRealEstatePurposeCheckOptions = async (data) =>
  await onFetchManageApi('get', `api/${version}/buy/realEstatePurpose/check-options`, data)

export const apiGETRealEstateTypeSelectOptions = async (data) =>
  await onFetchManageApi('get', `api/${version}/buy/realEstateType/select-options`, data)

export const apiGETRealEstateParkingTypeSelectOptions = async (data) =>
  await onFetchManageApi('get', `api/${version}/buy/realEstateParkingType/select-options`, data)
