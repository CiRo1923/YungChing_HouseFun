import { onDeepMerge } from '@js/_prototype.js'

export default () => {
  const { onCustom } = usePopupActions()
  const buyPopup = useBuyPopupStore()
  const { buttons } = storeToRefs(buyPopup)
  const popupActions = usePopupActions()
  const { onMergeBtns } = popupActions
  const onAlert = (data) => {
    const alertBtns = buttons.value.alert

    return popupActions.onAlert({
      ...data,
      ...{
        btns: onMergeBtns(alertBtns, data.btns),
      },
    })
  }
  const onConfirm = (data) => {
    const confirmBtns = buttons.value.confirm

    return popupActions.onConfirm({
      ...data,
      ...{
        btns: onMergeBtns(confirmBtns, data.btns),
      },
    })
  }
  const onLogin = (data) => {
    const loginBtns = buttons.value.login

    return onCustom({
      id: 'loginSystem',
      title: data?.title || '會員登入',
      btns: onDeepMerge(loginBtns, data?.btns),
    })
  }

  return {
    onAlert,
    onConfirm,
    onLogin,
  }
}
