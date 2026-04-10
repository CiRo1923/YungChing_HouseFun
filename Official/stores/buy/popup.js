import { onDeepMerge, onBodyOverflowHiddenToggle } from '@js/_prototype.js'

import { defineStore } from 'pinia'

export const useBuyPopupStore = defineStore('popup', () => {
  const buttons = readonly({
    alert: [
      {
        label: '確認',
        class: '--bg-orange-e646',
        type: 'sure',
        isClose: true,
      },
    ],
    confirm: [
      {
        label: '確認',
        class: '--bg-orange-e646',
        type: 'sure',
        isClose: true,
      },
      {
        label: '取消',
        class: '--bg-gray-f2',
        type: 'cancel',
        isClose: true,
      },
    ],
  })
  const alertData = reactive({
    id: null,
    title: null,
    content: null,
    btns: buttons.alert,
    isExistClose: true,
    check: null,
    close() {
      this.id = null
      this.title = null
      this.content = null
      this.btns = buttons.alert
      this.isExistClose = true
      this.check = null

      onBodyOverflowHiddenToggle(false)
    },
  })
  const alert = (obj) => {
    alertData.id = 'alertSystem'
    alertData.title = obj.title
    alertData.content = obj.content
    alertData.btns = onDeepMerge(buttons.alert, obj.btns)
    alertData.isExistClose = obj.isExistClose

    onBodyOverflowHiddenToggle(true)

    return new Promise((resolve) => {
      alertData.check = resolve
    })
  }
  const confirmData = reactive({
    id: null,
    title: null,
    content: null,
    btns: buttons.confirm,
    isExistClose: true,
    check: null,
    close() {
      this.id = null
      this.title = null
      this.content = null
      this.btns = buttons.confirm
      this.isExistClose = true
      this.check = null

      onBodyOverflowHiddenToggle(false)
    },
  })
  const confirm = (obj) => {
    const onMergeBtns = () => {
      let btns = buttons.confirm

      if (obj.btns) {
        btns = []

        for (let i = 0; i < obj.btns.length; i += 1) {
          const { type } = obj.btns[i]
          const matchBtn = buttons.confirm.find((item) => item.type === type)

          btns.push({
            ...matchBtn,
            ...obj.btns[i],
          })
        }

        if (btns.length < 2) {
          for (let i = 0; i < confirmData.btns.length; i += 1) {
            const { type } = confirmData.btns[i]
            const noMatchBtn = btns.find((item) => item.type !== type)

            if (noMatchBtn) {
              btns.push(confirmData.btns[i])
            }
          }
        }
      }

      return btns
    }

    confirmData.id = 'confirmSystem'
    confirmData.title = obj.title
    confirmData.content = obj.content
    confirmData.btns = onMergeBtns()
    confirmData.isExistClose = obj.isExistClose

    onBodyOverflowHiddenToggle(true)

    return new Promise((resolve) => {
      confirmData.check = resolve
    })
  }
  const customData = reactive({
    id: null,
    title: null,
    btns: null,
    isExistClose: true,
    check: null,
    close() {
      this.id = null
      this.title = null
      this.btns = null
      this.isExistClose = true
      this.check = null

      onBodyOverflowHiddenToggle(false)
    },
  })
  const custom = (obj) => {
    customData.title = obj.title
    customData.id = obj.id
    customData.btns = obj.btns
    customData.isExistClose = obj.isExistClose

    onBodyOverflowHiddenToggle(true)

    return new Promise((resolve) => {
      customData.check = resolve
    })
  }
  const apiRunData = reactive({
    id: null,
    title: null,
    content: '資料處理中，請勿退出或關閉頁面<br />感謝您耐心等候！',
    isExistClose: false,
    close() {
      this.id = null
    },
  })
  const apiRun = (type) => {
    if (type === 'open') {
      apiRunData.id = 'apiRunSystem'
    } else {
      apiRunData.close()
    }
  }
  const apiError = (config, status, data) => {
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

    alert({
      title,
      content,
    })
  }
  const onReset = () => {
    alertData.close()
    confirmData.close()
    customData.close()
    apiRunData.close()
  }

  return {
    alertData,
    alert,
    confirmData,
    confirm,
    customData,
    custom,
    apiRunData,
    apiRun,
    apiError,
    onReset,
  }
})
