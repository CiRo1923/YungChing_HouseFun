import { onDeepMerge, onBodyOverflowHiddenToggle } from '@js/_prototype.js'

export default () => {
  const popup = usePopupStore()
  const {
    promise,
    alertCheck,
    confirmCheck,
    customCheck,
    alertData,
    confirmData,
    customData,
    apiPromiseData,
    apiError,
  } = storeToRefs(popup)
  // dataBtns 只需帶要覆寫的欄位,依 type 比對基準按鈕合併回完整資訊,順序一律以 dataBtns 為主
  // buttons 有給時視為完整集合,dataBtns 未提到的按鈕接在後面
  // buttons 未給時僅以 popup.buttons.confirm 補欄位,顆數由 dataBtns 決定(同 type 可重複)
  const onMergeBtns = (dataBtns, buttons) => {
    if (!dataBtns) return buttons || null

    const baseBtns = buttons || popup.buttons.confirm
    const mergedBtns = dataBtns.map((btn) => {
      const matchBtn = baseBtns.find(({ type }) => type === btn.type)

      return matchBtn ? onDeepMerge({}, matchBtn, btn) : { ...btn }
    })

    if (!buttons) return mergedBtns

    const restBtns = baseBtns.filter(({ type }) => !dataBtns.some((btn) => btn.type === type))

    return [...mergedBtns, ...restBtns]
  }
  const onPromise = (status) => {
    promise.value.status = status
  }
  // popup 的 Promise 只能被結算一次。先取出 resolver 再清空、最後才呼叫:
  // resolve 的續行若立刻再開一個 popup,新的 resolver 才不會被這裡的清空蓋掉。
  // resolver 已是 null(例如關閉兩次)時靜靜跳過,不讓呼叫端炸掉。
  const onSettle = (checkRef, isSure = false, item = null) => {
    const resolve = checkRef.value

    checkRef.value = null
    resolve?.(isSure, item)
  }
  // 需要「回報結果但不關閉」時使用(例如 isClose: false 的按鈕自行驗證後回報)
  const onCustomSettle = (isSure = false, item = null) => onSettle(customCheck, isSure, item)
  // ⚠ 開啟時必須「無條件覆寫每一個欄位」:關閉只清 id,其餘資料留到這裡才被蓋掉,
  //   否則退場動畫期間 popup 會瞬間變空(內容消失、寬度跳回預設)。
  //   日後在 store 新增欄位時,這三個開啟函式也要一併補上賦值。
  const onAlert = (data) => {
    // 前一個 alert 還沒結算就被蓋掉 → 先以「未確認」收掉,避免它的 await 永久卡住
    onSettle(alertCheck)

    const buttons = popup.buttons.alert

    alertData.value.id = 'alertSystem'
    alertData.value.title = data.title
    alertData.value.icon = data.icon
    alertData.value.content = data.content
    alertData.value.btns = onDeepMerge(buttons, data.btns)
    alertData.value.hasExistClose = data.hasExistClose !== undefined ? data.hasExistClose : true
    alertData.value.setClass = data.setClass

    onBodyOverflowHiddenToggle(true)

    return new Promise((resolve) => {
      alertCheck.value = (isSure, item) => {
        resolve({
          isSure,
          item,
        })
      }
    })
  }
  // 只清 id(那是關閉訊號),其餘欄位留著讓退場動畫有完整內容可渲染,下次開啟時才被覆寫。
  // isSure / item 會被回傳給 await 端;由 X 鈕或 onReset 呼叫時視為「未確認」
  const onAlertClose = (isSure = false, item = null) => {
    alertData.value.id = null

    onSettle(alertCheck, isSure, item)
    onBodyOverflowHiddenToggle(false)
  }
  const onConfirm = (data) => {
    onSettle(confirmCheck)

    const buttons = popup.buttons.confirm

    confirmData.value.id = 'confirmSystem'
    confirmData.value.title = data.title
    confirmData.value.icon = data.icon
    confirmData.value.content = data.content
    confirmData.value.btns = onMergeBtns(data.btns, buttons)
    confirmData.value.hasExistClose = data.hasExistClose !== undefined ? data.hasExistClose : true
    confirmData.value.setClass = data.setClass

    onBodyOverflowHiddenToggle(true)

    return new Promise((resolve) => {
      confirmCheck.value = (isSure, item) => {
        resolve({
          isSure,
          item,
        })
      }
    })
  }
  const onConfirmClose = (isSure = false, item = null) => {
    confirmData.value.id = null

    onSettle(confirmCheck, isSure, item)
    onBodyOverflowHiddenToggle(false)
  }
  const onCustom = async (data) => {
    // 若已有「不同 id」的 custom popup 開著,先關掉並等一個 flush 再開新的。
    // 否則舊 popup 的 leave 與新 popup 的 enter 會擠在同一個同步 flush,
    // 兩個 <Teleport to="#box"> 同時 patch 會搶錨點,
    // 觸發 "Cannot read properties of null (reading 'insertBefore')"。
    if (customData.value.id && customData.value.id !== data.id) {
      onCustomClose()
      await nextTick()
    }

    // 同 id 連續開啟時走不到上面那段,舊 resolver 仍在 → 一律先收掉
    onSettle(customCheck)

    customData.value.id = data.id
    customData.value.title = data.title
    customData.value.icon = data.icon
    customData.value.content = data.content
    customData.value.data = data.data
    customData.value.btns = data.btns
    customData.value.hasExistClose = data.hasExistClose !== undefined ? data.hasExistClose : true

    onBodyOverflowHiddenToggle(true)

    return new Promise((resolve) => {
      customCheck.value = (isSure, item) => {
        resolve({
          isSure,
          item,
        })
      }
    })
  }
  const onCustomClose = (isSure = false, item = null) => {
    customData.value.id = null

    onSettle(customCheck, isSure, item)
    onBodyOverflowHiddenToggle(false)
  }
  const onApiPromise = (type) => {
    if (type === 'open') {
      apiPromiseData.value.id = 'apiPromiseSystem'
    } else {
      onApiPromiseClose()
    }
  }
  const onApiPromiseClose = () => {
    apiPromiseData.value.id = null
  }
  const onApiError = (config = {}, status, data = {}) => {
    if (import.meta.server) {
      apiError.value = { config, status, data }
    } else {
      const title = '錯誤訊息'
      const statusMessages = {
        404: '存取的對應的資料已被刪除、移動或從未存在',
        503: '服務無法使用',
      }
      const apiMessage = data.Message || data.message || data.title
      const message = statusMessages[status] || apiMessage
      const content = `${config.url}<br />${status} 錯誤:<br />${message}`

      onAlert({
        title,
        content,
      })
    }
  }
  const onApiErrorServerToClient = () => {
    if (apiError.value) {
      const { config, status, data } = apiError.value

      onApiError(config, status, data)
    }
  }
  const onApiErrorClear = () => {
    apiError.value = null
  }
  const onReset = () => {
    onAlertClose()
    onConfirmClose()
    onCustomClose()
    onApiPromiseClose()
  }

  return {
    onMergeBtns,
    onPromise,
    onAlert,
    onAlertClose,
    onConfirm,
    onConfirmClose,
    onCustom,
    onCustomClose,
    onCustomSettle,
    onApiPromise,
    onApiPromiseClose,
    onApiError,
    onApiErrorServerToClient,
    onApiErrorClear,
    onReset,
  }
}
