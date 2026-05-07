import { apiPOSTRealEstateSearch } from '@js/_api/buy/index.js'

import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

export default () => {
  const { onReplaceImageSize } = useBuyProjectActions()
  const buyList = useBuyListStore()
  const { apiData, datas } = storeToRefs(buyList)
  const { onApiError } = useBuyPopupActions()
  const onApiPOSTRealEstateSearch = async (caseStatusToken) => {
    const route = useRoute()
    const page = route.query.pg ? +route.query.pg : 1
    const { config, status, data } = await apiPOSTRealEstateSearch({
      is7DayExpirerFilterer: false,
      caseStatusToken, // 刊登中: 1、草稿: 2、已成交: 3、已下架: 4
      page,
      pageSize: 3,
      ...apiData.value,
    })

    if (status === 200) {
      const { casesList } = data

      const imageSize = {
        width: 400,
        height: 304,
      }
      const list = onReplaceImageSize(casesList, 'picURLCover', imageSize)
      datas.value = list // 替換 width  & height

      console.log(data)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onReset = () => {
    datas.value = null
  }

  return {
    onApiPOSTRealEstateSearch,
    onReset,
  }
}
