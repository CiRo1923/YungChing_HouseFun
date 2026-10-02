/* starter —— 這一支是起手樣板:複製一次,之後歸接手的專案所有。

  整套更新時**不要覆蓋它**。這個站有哪幾種彈窗、各自的版面與預設 class
  都收在這裡,蓋過去等於把已經接好的那一套換成別人的 ——
  而那不會報錯,要開啟那個彈窗才看得出來。

  按鈕的文字與配色(buttons)、以及那幾個預設開關(defaultOptions)
  本來就是給各專案改的,更不該被蓋回去。 */
export const usePopupStore = defineStore('popup', () => {
  const alertCheck = ref(null)
  const confirmCheck = ref(null)
  const customCheck = ref(null)
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
  /* 彈窗掛在版面上的哪一個容器裡。

    那個容器由各專案的進入點自己放(名字、位置都可能不一樣),
    所以是設定值而不是寫在容器的畫面區段裡 ——
    **找不到目標時什麼都不會報**,彈窗就是不出現,
    而畫面上看起來像是「這個彈窗沒有被打開」。 */
  const teleportTarget = '#teleports'

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

    /* api 錯誤窗。它走的是提示窗(onAlert),但標題、圖示與版面多半與一般提示
      不同 —— 錯誤窗長什麼樣每個站本來就不一樣(要不要圖示、多寬、文字置不置中)。

      除了 statusMessages 之外的每一項**原樣交給 onAlert**,
      所以鍵名與開啟彈窗時能傳的那幾項相同。

      statusMessages 是「這個狀態碼要對使用者說什麼」。
      後端有回訊息時用後端那一句,只有沒回的時候才用這裡的 ——
      所以這份只要列那幾個後端不會給訊息的狀態碼。 */
    apiError: {
      title: '錯誤訊息',
      icon: 'icon_circle_exclamation',
      setClass: {
        main: 'p:--w-450 t:--w-300',
        content: 'text-center',
      },
      statusMessages: {
        404: '存取的對應的資料已被刪除、移動或從未存在',
        503: '服務無法使用',
      },
    },
  })

  return {
    alertCheck,
    confirmCheck,
    customCheck,
    promise,
    buttons,
    defaultOptions,
    teleportTarget,
    alertData,
    confirmData,
    customData,
    apiPromiseData,
    apiError,
  }
})
