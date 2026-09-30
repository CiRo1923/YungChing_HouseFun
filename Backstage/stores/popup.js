export const usePopupStore = defineStore('popup', () => {
  let alertCheck = ref(null)
  let confirmCheck = ref(null)
  let customCheck = ref(null)
  const promise = ref({
    message: '資料處理中，請勿退出或關閉頁面<br />感謝您耐心等候！',
    status: 'close', // 'open' / 'close'
  })
  const buttons = readonly({
    alert: [
      {
        id: 'sure',
        label: '確認',
        class: '--bg-green-6a2d --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
    confirm: [
      {
        id: 'cancel',
        label: '取消',
        class: '--border-gray-e5 --text-gray-666',
        type: 'cancel',
        isClose: true,
      },
      {
        id: 'sure',
        label: '確認',
        class: '--bg-green-6a2d --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
  })
  const alertData = reactive({
    id: null,
    title: null,
    icon: null,
    content: null,
    btns: null,
    hasExistClose: true,
    setClass: null,
  })
  const confirmData = reactive({
    id: null,
    title: null,
    icon: null,
    content: null,
    btns: null,
    hasExistClose: true,
    setClass: null,
  })

  const customData = reactive({
    id: null,
    title: null,
    icon: null,
    content: null,
    data: null,
    btns: null,
    hasExistClose: true,
  })

  const apiPromiseData = reactive({
    id: null,
    title: null,
    content: promise.value.message,
    hasExistClose: false,
  })
  const apiError = ref(null)

  /* 開啟彈窗時沒有傳的那幾項,用這裡的值 —— **這一組是給各專案改成自己的值的**。

    為什麼放在這裡而不是寫在行為那一支裡:行為那一支(usePopupActions)是
    **整套覆蓋的對象**,預設值寫在那裡的話,改過的下一次更新就被蓋回去。
    而這支 store 是起手樣板,複製一次之後歸這個專案所有。

    少了這一組的話,要預設不顯示關閉鈕只剩一條路:每一個開啟彈窗的地方
    各傳一次 —— 而漏傳的那一處不會有任何提示,只是那個彈窗多一個叉叉。

    取用的時候不要走 storeToRefs:readonly 包的是普通物件,
    那一支只收 ref 與 reactive,拿到的會是 undefined。 */
  const defaultOptions = readonly({
    alert: { hasExistClose: true },
    confirm: { hasExistClose: true },
    custom: { hasExistClose: true },
  })

  return {
    alertCheck,
    confirmCheck,
    customCheck,
    promise,
    buttons,
    defaultOptions,
    alertData,
    confirmData,
    customData,
    apiPromiseData,
    apiError,
  }
})
