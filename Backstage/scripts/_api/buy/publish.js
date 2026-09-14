import { fetchApi } from '@js/_api/.config.js'

// basic
export const apiPostBuyRealEstateNewCase = async (data) =>
  await fetchApi.post(`buy/realEstate/NewCase`, data)

export const apiGetBuyRealEstateHfID = async (data) =>
  await fetchApi.get(`buy/realEstate/{hfID}`, data)

export const apiPostStringBuyRealEstateHfID = async (data) =>
  await fetchApi.postString(`buy/realEstate/{hfID}`, data)

export const apiPostStringBuyRealEstateDraftHfID = async (data) =>
  await fetchApi.postString(`buy/realEstateDraft/{hfID}`, data)

export const apiPostFormBuyRealEstatePicUpload = async (data) =>
  await fetchApi.postForm(`buy/realEstatePic/Upload`, data)

export const apiGetBuyRealEstatePurposeCheckOptions = async (data) =>
  await fetchApi.get(`buy/realEstatePurpose/check-options`, data)

export const apiGetBuyCityCodeDistrictCodeRoad = async (data) =>
  await fetchApi.get(`buy/{cityCode}/{districtCode}/Road`, data)

export const apiGetBuyRealEstateTypeSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateType/select-options`, data)

export const apiGetBuyRealEstateLegalUsageSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateLegalUsage/select-options`, data)

export const apiGetBuyRealEstateZoingCheckOptions = async (data) =>
  await fetchApi.get(`buy/realEstateZoing/check-options`, data)

export const apiGetBuyRealEstateZoingCitySelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateZoingCity/select-options`, data)

export const apiGetBuyRealEstateZoingLandSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateZoingLand/select-options`, data)

export const apiGetBuyRealEstateAgeIdentifySelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateAgeIdentify/select-options`, data)

export const apiGetBuyRealEstateFloorSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateFloor/select-options`, data)

export const apiGetBuyCommunities = async (data) => await fetchApi.get(`buy/communities`, data)

export const apiGetBuyRealEstateFaceSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateFace/select-options`, data)

export const apiGetBuyRealEstateStructionSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateStruction/select-options`, data)

export const apiGetBuyRealEstateBarrierFreeCheckOptions = async (data) =>
  await fetchApi.get(`buy/realEstateBarrierfree/check-options`, data)

export const apiGetBuyRealEstateManageTypeSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateManageType/select-options`, data)

export const apiGetBuyRealEstateManageDutySelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateManageDuty/select-options`, data)

export const apiGetBuyRealEstateManagePayPeriodSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateManagePayPeriod/select-options`, data)

export const apiGetBuyRealEstateParkingModeSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateParkingMode/select-options`, data)

export const apiGetBuyRealEstateParkingTypeSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateParkingType/select-options`, data)

export const apiGetBuyRealEstateParkingRegSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateParkingReg/select-options`, data)

export const apiGetBuyRealEstateParkingPayPeriodSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateParkingPayPeriod/select-options`, data)

export const apiGetBuyRealEstateVideoDisplaySelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateVideoDisplay/select-options`, data)

export const apiGetBuyRealEstateVideoTypeSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstateVideoType/select-options`, data)

export const apiGetBuyRealEstateFeatureCheckOptions = async (data) =>
  await fetchApi.get(`buy/realEstateFeature/check-options`, data)

export const apiGetBuyRealEstatePosterDataSourceSelectOptions = async (data) =>
  await fetchApi.get(`buy/realEstatePosterDataSource/select-options`, data)

// renewal
export const apiPostBuyRealEstateReadToPublish = async (data) =>
  await fetchApi.post(`buy/realEstate/ReadToPublish`, data)

// basic / renewal / fiinish
export const apiGetBuyRealEstateCaseStatusHfID = async (data) =>
  await fetchApi.get(`buy/realEstate/CaseStatus/{hfID}`, data)
