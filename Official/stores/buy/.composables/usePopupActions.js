import { onDeepMerge } from '@js/_prototype.js'

export default () => {
  const { onCustom } = usePopupActions()
  const buyPopup = useBuyPopupStore()
  const popupActions = usePopupActions()
  const { onMergeBtns } = popupActions
  const onAlert = (data) => {
    const buttons = buyPopup.buttons.alert

    return popupActions.onAlert({
      ...data,
      ...{
        btns: onMergeBtns(buttons, data.btns),
      },
    })
  }
  const onConfirm = (data) => {
    const buttons = buyPopup.buttons.confirm

    return popupActions.onConfirm({
      ...data,
      ...{
        btns: onMergeBtns(buttons, data.btns),
      },
    })
  }
  const onLogin = (data) => {
    const buttons = buyPopup.buttons.login

    return onCustom({
      id: 'loginSystem',
      title: data?.title || '會員登入',
      btns: onDeepMerge(buttons, data?.btns),
    })
  }

  return {
    onAlert,
    onConfirm,
    onLogin,
  }
}
