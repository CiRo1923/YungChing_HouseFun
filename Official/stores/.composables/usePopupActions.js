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
  const onAlert = (data) => {
    const buttons = popup.buttons.alert

    alertData.value.id = 'alertSystem'
    alertData.value.title = data.title
    alertData.value.icon = data.icon
    alertData.value.content = data.content
    alertData.value.btns = onDeepMerge(buttons, data.btns)
    alertData.value.hasExistClose = data.hasExistClose !== undefined ? data.hasExistClose : true

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
  const onAlertClose = () => {
    alertData.value.id = null
    alertData.value.title = null
    alertData.value.icon = null
    alertData.value.content = null
    alertData.value.btns = popup.buttons.alert
    alertData.value.hasExistClose = true
    alertData.value.setClass = null
    alertCheck.value = null

    onBodyOverflowHiddenToggle(false)
  }
  const onConfirm = (data) => {
    const buttons = popup.buttons.confirm

    confirmData.value.id = 'confirmSystem'
    confirmData.value.title = data.title
    confirmData.value.icon = data.icon
    confirmData.value.content = data.content
    confirmData.value.btns = onMergeBtns(buttons, data.btns)
    confirmData.value.hasExistClose = data.hasExistClose !== undefined ? data.hasExistClose : true

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
  const onConfirmClose = () => {
    confirmData.value.id = null
    confirmData.value.title = null
    confirmData.value.icon = null
    confirmData.value.content = null
    confirmData.value.btns = popup.buttons.confirm
    confirmData.value.hasExistClose = true
    confirmData.value.setClass = null
    confirmCheck.value = null

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
  const onCustomClose = () => {
    customData.value.id = null
    customData.value.title = null
    customData.value.icon = null
    customData.value.content = null
    customData.value.data = null
    customData.value.btns = null
    customData.value.hasExistClose = true
    customCheck.value = null

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
    onApiPromise,
    onApiError,
    onApiErrorServerToClient,
    onApiErrorClear,
    onReset,
  }
}
