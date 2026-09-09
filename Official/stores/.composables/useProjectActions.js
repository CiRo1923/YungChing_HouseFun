import { apiGetCommonServerTime } from '@js/_api/manage.js'

import { onFormatDate } from '@js/_prototype.js'

export default () => {
  const project = useProjectStore()
  const { serverTime, serverTimeBase } = storeToRefs(project)
  const { onApiError } = usePopupActions()

  const onFormatServerTime = (date) => ({
    value: onFormatDate(date, 'YYYY-MM-DD'),
    full: onFormatDate(date, 'YYYY-MM-DD hh:mm:ss'),
    year: onFormatDate(date, 'YYYY'),
    month: onFormatDate(date, 'MM'),
    day: onFormatDate(date, 'DD'),
    hours: onFormatDate(date, 'hh'),
    minute: onFormatDate(date, 'mm'),
    second: onFormatDate(date, 'ss'),
  })

  // 呼叫端的用法不變:await 這支之後,serverTime 就是「當下」的伺服器時間。
  // 差別在它只會真的打一次 API —— 之後都用基準 + 經過的時間推算。
  //
  // 為什麼可以這樣:要防的是 client 系統時間本身不準(時區 / 日期被改),
  // 而 performance.now() 量的是單調流逝的時間,不受系統時鐘影響,
  // 所以「後端給的時間 + 流逝的毫秒」仍然是可信的當下時間。
  //
  // 以前每個呼叫端都直接打,光是一次導頁(layout 的 onInit 驗兩支 cookie 的效期)
  // 就要打兩支。
  const onApiGetCommonServerTime = async () => {
    const base = serverTimeBase.value

    // 基準要是「這個執行環境自己量的」才能用(見 stores/project.js 的說明)
    if (base && base.onServer === import.meta.server) {
      serverTime.value = onFormatServerTime(base.epoch + (performance.now() - base.at))

      return { config: null, status: 200, data: null }
    }

    const { config, status, data } = await apiGetCommonServerTime()

    if (status === 200) {
      serverTime.value = onFormatServerTime(data.serverTime)

      // 帶空的 format 會回傳解析後的毫秒字串;解析不出來就不建立基準,
      // 維持原本「每次都打」的行為,不要讓推算建立在錯的起點上。
      const epoch = Number(onFormatDate(data.serverTime))

      if (Number.isFinite(epoch) && epoch > 0) {
        serverTimeBase.value = {
          epoch,
          at: performance.now(),
          onServer: import.meta.server,
        }
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
