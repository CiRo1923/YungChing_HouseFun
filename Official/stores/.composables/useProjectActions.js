import { apiGetCommonServerTime } from '@js/_api/manage.js'

import { onFormatDate } from '@js/_prototype.js'

export default () => {
  const project = useProjectStore()
  const { serverTime } = storeToRefs(project)
  const { onApiError } = usePopupActions()

  const onApiGetCommonServerTime = async () => {
    const { config, status, data } = await apiGetCommonServerTime()

    if (status === 200) {
      serverTime.value = {
        value: onFormatDate(data.serverTime, 'YYYY-MM-DD'),
        full: onFormatDate(data.serverTime, 'YYYY-MM-DD hh:mm:ss'),
        year: onFormatDate(data.serverTime, 'YYYY'),
        month: onFormatDate(data.serverTime, 'MM'),
        day: onFormatDate(data.serverTime, 'DD'),
        hours: onFormatDate(data.serverTime, 'hh'),
        minute: onFormatDate(data.serverTime, 'mm'),
        second: onFormatDate(data.serverTime, 'ss'),
      }
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  return {
    onApiGetCommonServerTime,
  }
}
