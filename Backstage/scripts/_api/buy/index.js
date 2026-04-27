import { onFetchApi } from '@js/_api/export.js'

export const version = 'v1'

export const apiPOSTRealEstateNewCase = async (data) =>
  await onFetchApi.post(`api/${version}/buy/realEstate/NewCase`, data)

export const apiGETRealEstate = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstate/{hfid}`, data)

export const apiPOSTRealEstate = async (data) =>
  await onFetchApi.postForm(`api/${version}/buy/realEstate/{hfid}`, data)

export const apiPOSTRealEstateDraft = async (data) =>
  await onFetchApi.postForm(`api/${version}/buy/realEstateDraft/{hfid}`, data)

export const apiPOSTRealEstatePicUpload = async (data) =>
  await onFetchApi.postForm(`api/${version}/buy/realEstatePic/Upload`, data)

export const apiGETRealEstatePurposeCheckOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstatePurpose/check-options`, data)

export const apiGETCitySelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/city/select-options`, data)

export const apiGETDistrictSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/{cityCode}/district/select-options`, data)

export const apiGETRoad = async (data) =>
  await onFetchApi.get(`api/${version}/buy/{cityCode}/{districtCode}/Road`, data)

export const apiGETRealEstateTypeSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateType/select-options`, data)

export const apiGETRealEstateLegalUsageSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateLegalUsage/select-options`, data)

export const apiGETRealEstateZoingCheckOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateZoing/check-options`, data)

export const apiGETRealEstateZoingCitySelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateZoingCity/select-options`, data)

export const apiGETRealEstateZoingLandSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateZoingLand/select-options`, data)

export const apiGETRealEstateAgeIdentifySelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateAgeIdentify/select-options`, data)

export const apiGETRealEstateFloorSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateFloor/select-options`, data)

export const apiGETCommunities = async (data) =>
  await onFetchApi.get(`api/${version}/buy/communities`, data)

export const apiGETRealEstateFaceSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateFace/select-options`, data)

export const apiGETRealEstateStructionSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateStruction/select-options`, data)

export const apiGETRealEstateBarrierFreeCheckOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateBarrierfree/check-options`, data)

export const apiGETRealEstateManageTypeSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateManageType/select-options`, data)

export const apiGETRealEstateManageDutySelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateManageDuty/select-options`, data)

export const apiGETRealEstateManagePayPeriodSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateManagePayPeriod/select-options`, data)

export const apiGETRealEstateParkingModeSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateParkingMode/select-options`, data)

export const apiGETRealEstateParkingTypeSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateParkingType/select-options`, data)

export const apiGETRealEstateParkingRegSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateParkingReg/select-options`, data)

export const apiGETRealEstateParkingPayPeriodSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateParkingPayPeriod/select-options`, data)

export const apiGETRealEstateVideoDisplaySelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateVideoDisplay/select-options`, data)

export const apiGETRealEstateVideoTypeSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateVideoType/select-options`, data)

export const apiGETRealEstateFeatureCheckOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstateFeature/check-options`, data)

export const apiGETRealEstatePosterDataSourceSelectOptions = async (data) =>
  await onFetchApi.get(`api/${version}/buy/realEstatePosterDataSource/select-options`, data)
