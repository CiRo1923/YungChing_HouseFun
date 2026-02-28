import CardFilterInfo from '@pages/buy/_components/basic/CardFilterInfo.vue'
import CardFilterPrice from '@pages/buy/_components/basic/CardFilterPrice.vue'
import CardFilterPing from '@pages/buy/_components/basic/CardFilterPing.vue'
import CardFilterManage from '@pages/buy/_components/basic/CardFilterManage.vue'
import CardFilterFeature from '@pages/buy/_components/basic/CardFilterFeature.vue'
import CardFilterMedia from '@pages/buy/_components/basic/CardFilterMedia.vue'
import CardFilterParking from '@pages/buy/_components/basic/CardFilterParking.vue'
import CardFilterPosterInfo from '@pages/buy/_components/basic/CardFilterPosterInfo.vue'
import CardFilterTerms from '@pages/buy/_components/basic/CardFilterTerms.vue'

// import { useBuyProjectStore } from '@stores/buy/project.js'
import useStores from '@stores/buy/_composables/useStores.js'

// const buyProject = useBuyProjectStore()

// const { options, apiData } = storeToRefs(buyProject)

export const datas = shallowReadonly([
  {
    id: 'cardFilterInfo',
    label: '基本資料',
    component: CardFilterInfo,
  },
  {
    id: 'cardFilterPrice',
    label: '價格資訊',
    component: CardFilterPrice,
  },
  {
    id: 'cardFilterPing',
    label: '坪數資訊',
    component: CardFilterPing,
  },
  {
    id: 'cardFilterManage',
    label: '管理資訊',
    component: CardFilterManage,
  },
  {
    id: 'cardFilterParking',
    label: '車位資訊',
    component: CardFilterParking,
  },
  {
    id: 'cardFilterFeature',
    label: '特色描述',
    component: CardFilterFeature,
  },
  {
    id: 'cardFilterMedia',
    label: '影音設定',
    component: CardFilterMedia,
  },
  {
    id: 'cardFilterPosterInfo',
    label: '聯絡資訊',
    component: CardFilterPosterInfo,
  },
  {
    id: 'cardFilterTerms',
    label: '使用條款',
    component: CardFilterTerms,
  },
])

export const useBuyBasicAllPromise = () => {
  const { project } = useStores()

  return [
    useAsyncData('purpose-options', () => project.onApiGETRealEstatePurposeCheckOptions()),
    useAsyncData('city-options', () => project.onApiGETCitySelectOptions()),
    useAsyncData('type-options', () => project.onApiGETRealEstateTypeSelectOptions()),
    useAsyncData('usage-options', () => project.onApiGETRealEstateLegalUsageSelectOptions()),
    useAsyncData('zoing-options', () => project.onApiGETRealEstateZoingCheckOptions()),
    useAsyncData('zoingCity-options', () => project.onApiGETRealEstateZoingCitySelectOptions()),
    useAsyncData('zoingLand-options', () => project.onApiGETRealEstateZoingLandSelectOptions()),
    useAsyncData('floor-options', () => project.onApiGETRealEstateFloorSelectOptions()),
    useAsyncData('face-options', () => project.onApiGETRealEstateFaceSelectOptions()),
    useAsyncData('structure-options', () => project.onApiGETRealEstateStructionSelectOptions()),
    useAsyncData('barrierFree-options', () => project.onApiGETRealEstateBarrierFreeCheckOptions()),
    useAsyncData('manageType-options', () => project.onApiGETRealEstateManageTypeSelectOpstions()),
    useAsyncData('manageDuty-options', () => project.onApiGETRealEstateManageDutySelectOpstions()),
    useAsyncData('managePay-options', () =>
      project.onApiGETRealEstateManagePayPeriodSelectOpstions()
    ),
    useAsyncData('parkingMode-options', () => project.onApiGETRealEstateParkingModeSelectOptions()),
    useAsyncData('parkingType-options', () =>
      project.onApiGETRealEstateParkingTypeSelectOpstions()
    ),
    useAsyncData('parkingReg-options', () => project.onApiGETRealEstateParkingRegSelectOpstions()),
    useAsyncData('parkingPayPeriod-options', () =>
      project.onApiGETRealEstateParkingPayPeriodSelectOpstions()
    ),
    useAsyncData('videoType-options', () => project.onApiGETRealEstateVideoTypeSelectOpstions()),
    useAsyncData('feature-options', () => project.onApiGETRealEstateFeatureCheckOptions()),
  ]
}
