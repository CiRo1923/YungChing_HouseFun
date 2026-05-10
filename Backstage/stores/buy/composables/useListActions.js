import {
  apiPOSTRealEstateSearch,
  apiPOSTRealEstateOffline,
  apiPOSTRealEstateDeal,
} from '@js/_api/buy/list.js'

// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

export default () => {
  // const buyProject = useBuyProjectStore()
  // const { renewalPlanId } = storeToRefs(buyProject)
  const { onReplaceImageSize } = useBuyProjectActions()
  const buyList = useBuyListStore()
  const { apiData, apiDealData, datas } = storeToRefs(buyList)
  const { onApiError } = useBuyPopupActions()
  const selectItems = computed(() =>
    datas.value ? datas.value.filter((item) => item._checked.value).map((item) => item.hfID) : []
  )
  const selectCount = computed(() => selectItems.value.length)
  const onApiPOSTRealEstateSearch = async (caseStatusToken) => {
    const route = useRoute()
    const page = route.query.pg ? +route.query.pg : 1
    const { config, status, data } = await apiPOSTRealEstateSearch({
      is7DayExpirerFilterer: false,
      caseStatusToken, // 刊登中: 1、草稿: 2、已成交: 3、已下架: 4
      page,
      pageSize: 12,
      ...apiData.value,
    })

    if (status === 200) {
      const { casesList } = data

      const imageSize = {
        width: 640,
        height: 485,
      }
      const list = onReplaceImageSize(casesList, 'picURLCover', imageSize) // 替換 width  & height
      // 下架 會不能批次刊登的條件
      const onPublishDisabled = (item) => {
        const offlineInfo = item.caseOfflineInfo

        return (
          !offlineInfo || (![7, 8].includes(offlineInfo.reasonID) && offlineInfo.reasonID !== 1)
        )

        // (
        //   !offlineInfo ||
        //   (![7, 8].includes(offlineInfo.reasonID) &&
        //     (offlineInfo.reasonID !== 1 || !offlineInfo.note))
        // )
      }
      datas.value = list.map((item) => {
        return {
          ...item,
          _checked: {
            value: false,
            publish: onPublishDisabled(item),
          },
        }
      })

      console.log(datas.value)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiPOSTRealEstateOffline = async (hfids) => {
    const { config, status, data } = await apiPOSTRealEstateOffline({
      hfids,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiPOSTRealEstateDeal = async (hfids) => {
    const { config, status, data } = await apiPOSTRealEstateDeal({
      hfids,
      ...apiDealData.value,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onSyncCheckedDatas = (hfids) => {
    const idSet = new Set(hfids)

    datas.value = datas.value.map((item) => ({
      ...item,
      _checked: {
        ...item._checked,
        value: idSet.has(item.hfID),
      },
    }))
  }
  const onReset = () => {
    datas.value = null
  }

  return {
    selectItems,
    selectCount,
    onApiPOSTRealEstateSearch,
    onApiPOSTRealEstateOffline,
    onApiPOSTRealEstateDeal,
    onSyncCheckedDatas,
    onReset,
  }
}
