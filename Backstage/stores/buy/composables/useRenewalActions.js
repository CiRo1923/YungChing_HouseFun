import { apiPOSTRealEstateReadToPublish } from '@js/_api/buy/renewal.js'

import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

export default () => {
  const { onApiError } = useBuyPopupActions()
  const onApiPOSTRealEstateReadToPublish = async (hfid) => {
    const { config, status, data } = await apiPOSTRealEstateReadToPublish({
      hfid,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  return {
    onApiPOSTRealEstateReadToPublish,
  }
}
