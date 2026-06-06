import {
  apiGETCommonPlanAggregate,
  apiGETRealEstateSearchFilter,
  apiPOSTRealEstateCaseAggregate,
  apiPOSTRealEstateSearch,
  apiPOSTRealEstateOffline,
  apiPOSTRealEstateDeal,
  apiPOSTRealEstateRemove,
  apiGETRealEstateCaseViewCounts,
  apiGETCommentssearchCommentFilter,
  apiPOSTCommentsSearch,
  apiPOSTCommentsUpdateReplyStatue,
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
  const {
    apiCommentsDefault,
    apiSearchData,
    apiDealData,
    apiCommentsData,
    apiCommentUpdateData,
    serachOptions,
    commentsOptions,
    planAggregate,
    aggregate,
    searchDatas,
    commentsDatas,
    searchPagination,
    commentsPagination,
  } = storeToRefs(buyList)
  const { onCustom, onApiPromise, onApiError } = useBuyPopupActions()

  const searchSelectItems = computed(() =>
    searchDatas.value
      ? searchDatas.value.filter((item) => item._checked.value).map((item) => item.hfID)
      : []
  )
  const searchSelectCount = computed(() => searchSelectItems.value.length)
  // const commentsSelectItems = computed(() =>
  //   commentsDatas.value
  //     ? commentsDatas.value.filter((item) => item._checked).map((item) => item.commentID)
  //     : []
  // )
  const commentsSelectCount = computed(() => apiCommentUpdateData.value?.commentIDList.length)
  const renewalCanNotPublishData = computed(() => {
    const selectedIds = new Set(searchSelectItems.value)

    return searchDatas.value.filter((item) => selectedIds.has(item.hfID) && !item._checked.publish)
  })
  const renewalNotExpiredData = computed(() => {
    const selectedIds = new Set(searchSelectItems.value)

    return searchDatas.value.filter(
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
    if (serachOptions.value.purpose) return false

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
        serachOptions.value[targetKey] = data[sourceKey] ?? []
      })

      // console.log(data)
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
      searchDatas.value = list.map((item) => {
        return {
          ...item,
          _checked: {
            value: false,
            publish: onIsPublish(item),
            isExpired: onIsExpired(item),
          },
        }
      })

      searchPagination.value = {
        page,
        pageSize,
        total: totalPages,
      }

      // console.log(searchDatas.value)
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
  const onApiGETCommentssearchCommentFilter = async () => {
    const { config, status, data } = await apiGETCommentssearchCommentFilter()

    if (status === 200) {
      const keyMap = {
        status: 'commentStatusOptions',
        type: 'caseCommentTypeOptions',
      }

      Object.entries(keyMap).forEach(([targetKey, sourceKey]) => {
        commentsOptions.value[targetKey] = data[sourceKey] ?? []
      })
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTCommentsSearch = async () => {
    const { config, status, data } = await apiPOSTCommentsSearch({
      pageSize: 9,
      ...apiCommentsData.value,
    })

    if (status === 200) {
      const { commentsList, page, pageSize, totalPages } = data

      commentsDatas.value = commentsList.map((item) => ({
        ...item,
        _checked: false,
      }))

      commentsPagination.value = {
        page,
        pageSize,
        total: totalPages,
      }
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTCommentsUpdateReplyStatue = async () => {
    const { config, status, data } = await apiPOSTCommentsUpdateReplyStatue(
      apiCommentUpdateData.value
    )

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onSyncCheckedDatas = (hfIDs) => {
    const idSet = new Set(hfIDs)

    searchDatas.value = searchDatas.value.map((item) => ({
      ...item,
      _checked: {
        ...item._checked,
        value: idSet.has(item.hfID),
      },
    }))
  }
  const onCommentPopup = async () => {
    onApiPromise('open')

    const { status } = await onApiPOSTCommentsSearch()

    onApiPromise('close')

    if (status === 200) {
      const { isSure } = await onCustom({
        id: 'popupComment',
        title: '留言管理',
        icon: 'icon_dialogue',
        btns: [
          {
            label: '關閉',
            class: '--border-gray-e5 --text-gray-666',
            type: 'cancel',
            isClose: true,
          },
        ],
      })

      if (isSure) {
        onCommentsReset()
      }
    }
  }
  const onSearchReset = () => {
    apiSearchData.value = { ...buyList.apiSearchDataDefault }
    searchDatas.value = null
  }
  const onCommentsReset = () => {
    apiCommentsData.value = { ...apiCommentsDefault }
  }

  return {
    searchSelectItems,
    searchSelectCount,
    commentsSelectCount,
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
    onApiGETCommentssearchCommentFilter,
    onApiPOSTCommentsSearch,
    onApiPOSTCommentsUpdateReplyStatue,
    onSyncCheckedDatas,
    onCommentPopup,
    onSearchReset,
    onCommentsReset,
  }
}
