import { onDeepMerge, onBodyOverflowHiddenToggle } from '@js/_prototype.js'

import { usePopupStore } from '@stores/popup.js'
import { useBuyPopupStore } from '@stores/buy/popup.js'
import usePopupActions from '@stores/_composables/usePopupActions.js'

export const useBuyPopupActions = () => {
  const popupStore = usePopupStore()
  const buyPopupStore = useBuyPopupStore()
  const { onMergeBtns } = usePopupActions()
  const {
    alertCheck,
    confirmCheck,
    customCheck,
    alertData,
    confirmData,
    customData,
    apiPromiseData,
  } = storeToRefs(popupStore)
  const onAlert = (data) => {
    const buttons = buyPopupStore.buttons.alert

    alertData.value.id = 'alertSystem'
    alertData.value.title = data.title
    alertData.value.content = data.content
    alertData.value.btns = onDeepMerge(buttons, data.btns)
    alertData.value.hasExistClose = data.hasExistClose !== undefined ? data.hasExistClose : true

    onBodyOverflowHiddenToggle(true)

    return new Promise((resolve) => {
      alertCheck.value = resolve
    })
  }
  const onAlertClose = () => {
    alertData.value.id = null
    alertData.value.title = null
    alertData.value.content = null
    alertData.value.btns = buyPopupStore.buttons.alert
    alertData.value.hasExistClose = true
    alertCheck.value = null

    onBodyOverflowHiddenToggle(false)
  }
  const onConfirm = (data) => {
    const buttons = buyPopupStore.buttons.confirm

    onMergeBtns(buttons, data.btns)

    confirmData.value.id = 'confirmSystem'
    confirmData.value.title = data.title
    confirmData.value.content = data.content
    confirmData.value.btns = onMergeBtns()
    confirmData.value.hasExistClose = data.hasExistClose !== undefined ? data.hasExistClose : true

    onBodyOverflowHiddenToggle(true)

    return new Promise((resolve) => {
      confirmCheck.value = resolve
    })
  }
  const onConfirmClose = () => {
    confirmData.value.id = null
    confirmData.value.title = null
    confirmData.value.content = null
    confirmData.value.btns = buyPopupStore.buttons.confirm
    confirmData.value.hasExistClose = true
    confirmCheck.value = null

    onBodyOverflowHiddenToggle(false)
  }
  const onCustom = (data) => {
    customData.value.title = data.title
    customData.value.id = data.id
    customData.value.btns = data.btns
    customData.value.hasExistClose = data.hasExistClose !== undefined ? data.hasExistClose : true

    onBodyOverflowHiddenToggle(true)

    return new Promise((resolve) => {
      customCheck.value = resolve
    })
  }
  const onCustomClose = () => {
    customData.value.id = null
    customData.value.title = null
    customData.value.btns = null
    customData.value.hasExistClose = true
    customCheck.value = null

    onBodyOverflowHiddenToggle(false)
  }
  const onApiPromise = (type) => {
    if (type === 'open') {
      apiPromiseData.value.id = 'apiRunSystem'
    } else {
      onApiPromiseClose()
    }
  }
  const onApiPromiseClose = () => {
    apiPromiseData.value.id = null
  }
  const onApiError = (config, status, data) => {
    const title = '錯誤訊息'
    const message =
      status === 404
        ? '存取的對應的資料已被刪除、移動或從未存在'
        : status === 503
          ? '服務無法使用'
          : data.Message || data.title
    const content =
      /^(400|401)$/.test(status) && data.Message
        ? message
        : `${config.url}<br>${status} 錯誤:<br>${message}`

    onAlert({
      title,
      content,
    })
  }
  const onReset = () => {
    onAlertClose()
    onConfirmClose()
    onCustomClose()
    onApiPromiseClose()
  }

  return {
    onAlert,
    onAlertClose,
    onConfirm,
    onConfirmClose,
    onCustom,
    onCustomClose,
    onApiPromise,
    onApiPromiseClose,
    onApiError,
    onReset,
  }
}

export default useBuyPopupActions
