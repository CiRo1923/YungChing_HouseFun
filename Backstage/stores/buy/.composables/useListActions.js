import {
  apiGETCommonPlanAggregate,
  apiGETRealEstateSearchFilter,
  apiPOSTRealEstateCaseAggregate,
  apiPOSTRealEstateSearch,
  apiPOSTRealEstateOffline,
  apiPOSTRealEstateDeal,
  apiPOSTRealEstateRemove,
  apiGETRealEstateCaseViewCounts,
} from '@js/_api/buy/list.js'

// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/.composables/useProjectActions.js'
import useBuyPopupActions from '@stores/buy/.composables/usePopupActions.js'

export default () => {
  // const buyProject = useBuyProjectStore()
  // const { renewal } = storeToRefs(buyProject)
  const { onReplaceImageSize } = useBuyProjectActions()
  const buyList = useBuyListStore()
  const { apiSearchData, apiDealData, options, planAggregate, aggregate, datas, pagination } =
    storeToRefs(buyList)
  const { onApiError } = useBuyPopupActions()
  const selectItems = computed(() =>
    datas.value ? datas.value.filter((item) => item._checked.value).map((item) => item.hfID) : []
  )
  const selectCount = computed(() => selectItems.value.length)
  const renewalCanNotPublishData = computed(() => {
    const selectedIds = new Set(selectItems.value)

    return datas.value.filter((item) => selectedIds.has(item.hfID) && !item._checked.publish)
  })
  const renewalNotExpiredData = computed(() => {
    const selectedIds = new Set(selectItems.value)

    return datas.value.filter(
      (item) => selectedIds.has(item.hfID) && item._checked.publish && !item._checked.isExpired
    )
  })
  const onApiGETCommonPlanAggregate = async () => {
    const { config, status, data } = await apiGETCommonPlanAggregate()

    if (status === 200) {
      planAggregate.value = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiGETRealEstateSearchFilter = async () => {
    if (options.value.purpose) return false

    const { config, status, data } = await apiGETRealEstateSearchFilter()

    if (status === 200) {
      const keyMap = {
        purpose: 'casePurposeOptions',
        area: 'caseAddrOptions',
        exchange: 'caseExchangeOptions',
        golden: 'caseGoldenOptions',
        room: 'caseRoomOptions',
        price: 'casePriceOptions',
        pin: 'casePinOptions',
        down: 'caseDownOptions',
        dealShow: 'caseDealShowOptions',
      }

      Object.entries(keyMap).forEach(([targetKey, sourceKey]) => {
        options.value[targetKey] = data[sourceKey] ?? []
      })

      console.log(data)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstateCaseAggregate = async () => {
    const { config, status, data } = await apiPOSTRealEstateCaseAggregate()

    if (status === 200) {
      aggregate.value = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiPOSTRealEstateSearch = async (caseStatusToken) => {
    const route = useRoute()
    const page = route.query.pg ? +route.query.pg : 1
    const { config, status, data } = await apiPOSTRealEstateSearch({
      is7DayExpirerFilterer: false,
      caseStatusToken, // 刊登中: 1、草稿: 2、已成交: 3、已下架: 4
      page,
      pageSize: 12,
      ...apiSearchData.value,
    })

    if (status === 200) {
      const { casesList, page, pageSize, totalPages } = data

      const imageSize = {
        width: 640,
        height: 485,
      }
      const list = onReplaceImageSize(casesList, 'picURLCover', imageSize) // 替換 width  & height
      // 下架 會不能批次刊登的條件
      const onIsPublish = (item) => {
        const offlineInfo = item.caseOfflineInfo
        const draftInfo = item.caseDraftInfo

        if (offlineInfo) {
          return offlineInfo.isAllowRestoreToOnline
        }

        if (draftInfo) {
          return draftInfo.isReadToPublish
        }

        return true
      }
      const onIsExpired = (item) => {
        const offlineInfo = item.caseOfflineInfo
        const draftInfo = item.caseDraftInfo

        if (offlineInfo) {
          return offlineInfo.isAllowRestoreToOnline && offlineInfo.isExpired
        }

        if (draftInfo) {
          return draftInfo.isReadToPublish && draftInfo.isExpired
        }

        return true
      }
      datas.value = list.map((item) => {
        return {
          ...item,
          _checked: {
            value: false,
            publish: onIsPublish(item),
            isExpired: onIsExpired(item),
          },
        }
      })

      pagination.value = {
        page,
        pageSize,
        total: totalPages,
      }

      // console.log(datas.value)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstateOffline = async (hfIDs) => {
    const { config, status, data } = await apiPOSTRealEstateOffline({
      hfIDs,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiPOSTRealEstateDeal = async (hfIDs) => {
    const { config, status, data } = await apiPOSTRealEstateDeal({
      hfIDs,
      ...apiDealData.value,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstateRemove = async (hfIDs) => {
    const { config, status, data } = await apiPOSTRealEstateRemove({
      hfIDs,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGETRealEstateCaseViewCounts = async (hfID) => {
    const { config, status, data } = await apiGETRealEstateCaseViewCounts({
      hfID,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onSyncCheckedDatas = (hfIDs) => {
    const idSet = new Set(hfIDs)

    datas.value = datas.value.map((item) => ({
      ...item,
      _checked: {
        ...item._checked,
        value: idSet.has(item.hfID),
      },
    }))
  }
  const onReset = () => {
    apiSearchData.value = { ...buyList.apiSearchDataDefault }
    datas.value = null
  }

  return {
    selectItems,
    selectCount,
    renewalCanNotPublishData,
    renewalNotExpiredData,
    onApiGETCommonPlanAggregate,
    onApiGETRealEstateSearchFilter,
    onApiPOSTRealEstateCaseAggregate,
    onApiPOSTRealEstateSearch,
    onApiPOSTRealEstateOffline,
    onApiPOSTRealEstateDeal,
    onApiPOSTRealEstateRemove,
    onApiGETRealEstateCaseViewCounts,
    onSyncCheckedDatas,
    onReset,
  }
}
