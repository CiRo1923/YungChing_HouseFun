import { onFetchApi } from '@js/_api/export.js'

export const apiGETRealEstate = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstate/{hfid}', data)

export const apiPOSTRealEstate = async (data) =>
  await onFetchApi.postForm('api/v1/buy/realEstate/{hfid}', data)

export const apiPOSTRealEstateDraft = async (data) =>
  await onFetchApi.postForm('api/v1/buy/realEstateDraft/{hfid}', data)

export const apiGETRealEstatePurposeCheckOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstatePurpose/check-options', data)

export const apiGETCitySelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/city/select-options', data)

export const apiGETDistrictSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/{cityCode}/district/select-options', data)

export const apiGETRoad = async (data) =>
  await onFetchApi.get('api/v1/buy/{cityCode}/{districtCode}/Road', data)

export const apiGETRealEstateTypeSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateType/select-options', data)

export const apiGETRealEstateLegalUsageSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateLegalUsage/select-options', data)

export const apiGETRealEstateZoingCheckOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateZoing/check-options', data)

export const apiGETRealEstateZoingCitySelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateZoingCity/select-options', data)

export const apiGETRealEstateZoingLandSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateZoingLand/select-options', data)

export const apiGETRealEstateAgeIdentifySelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateAgeIdentify/select-options', data)

export const apiGETRealEstateFloorSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateFloor/select-options', data)

export const apiGETCommunities = async (data) =>
  await onFetchApi.get('api/v1/buy/communities', data)

export const apiGETRealEstateFaceSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateFace/select-options', data)

export const apiGETRealEstateStructionSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateStruction/select-options', data)

export const apiGETRealEstateBarrierFreeCheckOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateBarrierfree/check-options', data)

export const apiGETRealEstateManageTypeSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateManageType/select-options', data)

export const apiGETRealEstateManageDutySelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateManageDuty/select-options', data)

export const apiGETRealEstateManagePayPeriodSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateManagePayPeriod/select-options', data)

export const apiGETRealEstateParkingModeSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateParkingMode/select-options', data)

export const apiGETRealEstateParkingTypeSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateParkingType/select-options', data)

export const apiGETRealEstateParkingRegSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateParkingReg/select-options', data)

export const apiGETRealEstateParkingPayPeriodSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateParkingPayPeriod/select-options', data)

export const apiGETRealEstateVideoDisplaySelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateVideoDisplay/select-options', data)

export const apiGETRealEstateVideoTypeSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateVideoType/select-options', data)

export const apiGETRealEstateFeatureCheckOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstateFeature/check-options', data)

export const apiGETRealEstatePosterDataSourceSelectOptions = async (data) =>
  await onFetchApi.get('api/v1/buy/realEstatePosterDataSource/select-options', data)
