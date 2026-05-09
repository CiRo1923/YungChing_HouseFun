import { apiPOSTRealEstateSearch, apiPOSTRealEstateOffline } from '@js/_api/buy/list.js'

import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

export default () => {
  const { onReplaceImageSize } = useBuyProjectActions()
  const buyList = useBuyListStore()
  const { apiData, datas } = storeToRefs(buyList)
  const { onApiError } = useBuyPopupActions()
  const selectItems = computed(() =>
    datas.value ? datas.value.filter((item) => item._isSelect).map((item) => item.hfID) : []
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
      datas.value = list.map((item) => {
        return {
          ...item,
          _isSelect: false,
        }
      })

      console.log(data)
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

  const onReset = () => {
    datas.value = null
  }

  return {
    selectItems,
    selectCount,
    onApiPOSTRealEstateSearch,
    onApiPOSTRealEstateOffline,
    onReset,
  }
}
