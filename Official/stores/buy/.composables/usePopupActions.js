import { onDeepMerge } from '@js/_prototype.js'

export default () => {
  const { onCustom } = usePopupActions()
  const buyPopup = useBuyPopupStore()
  // buttons 直接從 store 取:它是 readonly 常數,既不是 ref 也不是 reactive,
  // storeToRefs 不會為它建立 ref —— 解構出來會是 undefined。
  const { buttons } = buyPopup
  const popupActions = usePopupActions()
  const { onMergeBtns } = popupActions
  const onAlert = (data) => {
    const alertBtns = buttons.alert

    return popupActions.onAlert({
      ...data,
      ...{
        btns: onMergeBtns(alertBtns, data.btns),
      },
    })
  }
  const onConfirm = (data) => {
    const confirmBtns = buttons.confirm

    return popupActions.onConfirm({
      ...data,
      ...{
        btns: onMergeBtns(confirmBtns, data.btns),
      },
    })
  }
  const onLogin = (data) => {
    const loginBtns = buttons.login

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
