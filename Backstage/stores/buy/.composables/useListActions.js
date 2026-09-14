import {
  apiGetVasCommonPlanAggregate,
  apiGetBuyRealEstateSearchFilter,
  apiGetBuyRealEstateCaseAggregate,
  apiPostBuyRealEstateSearch,
  apiPostBuyRealEstateOffline,
  apiPostBuyRealEstateDeal,
  apiPostBuyRealEstateRemove,
  apiGetBuyRealEstateCaseViewCounts,
  apiGetBuyCommentsSearchCommentFilter,
  apiPostBuyCommentsSearch,
  apiPostBuyCommentsUpdateReplyStatue,
} from '@js/_api/buy/list.js'

// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/.composables/useProjectActions.js'
import usePopupActions from '@stores/.composables/usePopupActions.js'

export default () => {
  // const buyProject = useBuyProjectStore()
  // const { renewal } = storeToRefs(buyProject)
  const { onReplaceImageSize } = useBuyProjectActions()
  const buyList = useBuyListStore()
  const {
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
  const { onCustom, onApiPromise, onApiError } = usePopupActions()
  // 這三個必須在 composable 頂層取得。列表查詢會從 popup 完成後、await 之後被呼叫，
  // 那時已經不在 setup 的同步流程裡，就地呼叫 useRoute / navigateTo 會拿不到 Nuxt instance
  const route = useRoute()
  const router = useRouter()
  const nuxtApp = useNuxtApp()

  const searchSelectItems = computed(() =>
    searchDatas.value
      ? searchDatas.value.filter((item) => item._checked.value).map((item) => item.hfID)
      : []
  )
  const searchSelectCount = computed(() => searchSelectItems.value.length)
  // 已勾選的留言。要從 commentsDatas 算,不能讀 apiCommentUpdateData.commentIDList ——
  // 那是「送出用」的清單,只有全選與單筆操作會寫入,逐列勾選不會碰它,
  // 於是勾了幾筆批次按鈕仍是 disabled,批次完成後筆數也清不掉。
  const commentsSelectItems = computed(() =>
    commentsDatas.value
      ? commentsDatas.value.filter((item) => item._checked).map((item) => item.commentID)
      : []
  )
  const commentsSelectCount = computed(() => commentsSelectItems.value.length)
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
  const onApiGetVasCommonPlanAggregate = async () => {
    const { config, status, data } = await apiGetVasCommonPlanAggregate()

    if (status === 200) {
      planAggregate.value = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiGetBuyRealEstateSearchFilter = async () => {
    if (serachOptions.value.purpose) return false

    const { config, status, data } = await apiGetBuyRealEstateSearchFilter()

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
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateCaseAggregate = async () => {
    const { config, status, data } = await apiGetBuyRealEstateCaseAggregate()

    if (status === 200) {
      aggregate.value = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiPostBuyRealEstateSearch = async (caseStatusToken) => {
    // pg 可能被手動改成非數字或 0 / 負數，一律回退第 1 頁（NaN >= 1 為 false）
    const queryPage = Number.parseInt(route.query.pg, 10)
    const page = queryPage >= 1 ? queryPage : 1
    const { config, status, data } = await apiPostBuyRealEstateSearch({
      is7DayExpirerFilterer: false,
      caseStatusToken, // 刊登中: 1、草稿: 2、已成交: 3、已下架: 4
      page,
      pageSize: 20, // 規格為每頁 20 筆
      ...apiSearchData.value,
    })

    if (status === 200) {
      const { casesList, page, pageSize, totalCount } = data

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
        total: totalCount, // 給總筆數
      }
    } else if (status === 404) {
      // pg 超過後端最大頁數時會回 404。
      // 初次載入是使用者自己輸入了不存在的頁數 → 導向 404 頁；
      // 操作後重新查詢（例如把該頁物件全部刪光）不該把人踢出列表 → 退回第 1 頁
      if (import.meta.server) {
        // 文案由 error.vue 依 statusCode 決定，這裡不帶 statusMessage
        //（h3 會警告長訊息該用 message，而且未來預設會被 sanitize）
        nuxtApp.runWithContext(() => showError({ statusCode: 404 }))
      } else {
        await router.replace({
          path: route.path,
          query: {
            ...route.query,
            pg: 1,
          },
        })
      }
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPostBuyRealEstateOffline = async (hfIDs) => {
    const { config, status, data } = await apiPostBuyRealEstateOffline({
      hfIDs,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiPostBuyRealEstateDeal = async (hfIDs) => {
    const { config, status, data } = await apiPostBuyRealEstateDeal({
      hfIDs,
      ...apiDealData.value,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPostBuyRealEstateRemove = async (hfIDs) => {
    const { config, status, data } = await apiPostBuyRealEstateRemove({
      hfIDs,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyRealEstateCaseViewCounts = async (hfID) => {
    const { config, status, data } = await apiGetBuyRealEstateCaseViewCounts({
      hfID,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiGetBuyCommentsSearchCommentFilter = async () => {
    const { config, status, data } = await apiGetBuyCommentsSearchCommentFilter()

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
  const onApiPostBuyCommentsSearch = async () => {
    const { config, status, data } = await apiPostBuyCommentsSearch({
      pageSize: 9,
      ...apiCommentsData.value,
    })

    if (status === 200) {
      const { commentsList, page, pageSize, totalCount } = data

      commentsDatas.value = commentsList.map((item) => ({
        ...item,
        _checked: false,
      }))

      commentsPagination.value = {
        page,
        pageSize,
        total: totalCount, // 給總筆數
      }
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPostBuyCommentsUpdateReplyStatue = async () => {
    const { config, status, data } = await apiPostBuyCommentsUpdateReplyStatue(
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
  const onOpenCommentPopup = async () => {
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
  // 開啟留言彈窗（含 onApiPromise loading）
  const onCommentPopup = async () => {
    onApiPromise('open')

    const { status } = await onApiPostBuyCommentsSearch()

    onApiPromise('close')

    if (status === 200) {
      await onOpenCommentPopup()
    }
  }
  // 彈窗內搜尋（不關閉重開彈窗，資料直接響應更新；loading 由呼叫端控制）
  const onCommentSearch = async () => {
    const { status } = await onApiPostBuyCommentsSearch()

    return { status }
  }
  const onSearchReset = () => {
    apiSearchData.value = { ...buyList.apiSearchDataDefault }
    searchDatas.value = null
  }
  const onCommentsReset = () => {
    apiCommentsData.value = { ...buyList.apiCommentsDefault }
  }

  return {
    searchSelectItems,
    searchSelectCount,
    commentsSelectItems,
    commentsSelectCount,
    renewalCanNotPublishData,
    renewalNotExpiredData,
    onApiGetVasCommonPlanAggregate,
    onApiGetBuyRealEstateSearchFilter,
    onApiGetBuyRealEstateCaseAggregate,
    onApiPostBuyRealEstateSearch,
    onApiPostBuyRealEstateOffline,
    onApiPostBuyRealEstateDeal,
    onApiPostBuyRealEstateRemove,
    onApiGetBuyRealEstateCaseViewCounts,
    onApiGetBuyCommentsSearchCommentFilter,
    onApiPostBuyCommentsSearch,
    onApiPostBuyCommentsUpdateReplyStatue,
    onSyncCheckedDatas,
    onCommentPopup,
    onCommentSearch,
    onSearchReset,
    onCommentsReset,
  }
}
