/* starter —— 這一支是起手樣板:複製一次,之後歸接手的專案所有。

  整套更新時**不要覆蓋它**。這個站有哪幾種彈窗、各自的版面與預設 class
  都收在這裡,蓋過去等於把已經接好的那一套換成別人的 ——
  而那不會報錯,要開啟那個彈窗才看得出來。

  版面那幾個值(defaultSetClass)本來就是給各專案改的,更不該被蓋回去。 */
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
        class: '--bg-orange-f74c --text-white',
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
        class: '--bg-orange-f74c --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
  })
  /* 這個站的彈窗長什麼樣 —— **這一組是給各專案改成自己的值的**。

    為什麼放在這裡,而不是寫在那幾支彈窗容器的畫面區段裡:

    那幾支容器是整套覆蓋的對象。寫在那裡的話,改過的那一行會在下一次更新時
    消失,而消失的當下沒有任何訊息 —— 只是彈窗的內距突然變成別人專案的值。

    而且這幾個值是好幾支容器共用的(提示、確認、自訂、處理中)。
    各寫一次的話,調整版面要記得每一支都改,漏掉的那一支與其他幾支長得不一樣,
    一樣不會報錯,要開到那一種彈窗才看得出來。

    開啟彈窗時傳進來的 setClass 接在這一組後面,不是取代它。

    **取用它的時候不要走 storeToRefs。** 那一支只轉 ref 與 reactive 的值,
    而 `readonly({…})` 底下是一個普通物件,兩者都不是 —— 它會被**靜默跳過**,
    解構出來是 undefined,而畫面上是一開彈窗就整個壞掉。
    直接寫 `<store>.defaultSetClass.…`,與這支 store 裡的 buttons 同一種取法。
    這一組永遠不變,本來就不需要響應式。 */
  const defaultSetClass = readonly({
    // 每一種彈窗共用的外框內距
    main: 'p:--py-40 tm:--py-24 p:--px-60 tm:--px-30',
    // 提示與確認這兩種訊息彈窗的預設寬;自訂彈窗的寬度由開啟它的地方決定
    messageWidth: 'p:--w-600 t:--w-460',
    // 彈窗底部那一排按鈕
    button: '--oval --h-45 --text-center w-full',
    // 那一排按鈕怎麼排(手機一行、桌機並排)
    buttonList:
      'm:flex m:justify-center m:gap-[8px] t:gap-x-[8px] pt:inline-flex pt:items-center p:gap-x-[16px]',
    // 每一顆按鈕佔多寬
    buttonItem: 'm:max-w-[50%] m:flex-1 t:w-[150px] p:w-[200px]',
    // 按鈕上的文字
    buttonText: 'font-normal',

    /* 內容區(訊息文字)的預設樣式。

      這是四種彈窗共用的那一份;某一種要不一樣時,
      在下面的 byType 填它自己的 content,容器會優先用那一個。
      開啟彈窗時傳的 setClass.body 又比兩者都優先。 */
    content: 'text-center leading-[1.7] text-[18px] text-[--gray-666]',

    /* 各種彈窗要另外加的 class,**鍵名與彈窗元件的 setClass 相同**,原樣交給它。

      上面那幾個是組合用的基礎值(好幾種彈窗共用同一份);這裡是各自的差異 ——
      標題要不要置中、內容要不要靠左,同一個站也常常只有其中一種要。
      不需要的留空物件,什麼都不會加上去。

      分開放而不是讓專案去改容器:那幾支容器是整套覆蓋的對象,
      改在那裡的話,下一次更新那一行就消失了,而消失的當下沒有訊息。 */
    byType: {
      alert: {},
      confirm: {},
      custom: {},
      apiPromise: {},
    },
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

  /* 伺服器端發生的 api 錯誤,先存在這裡,等到瀏覽器端再補跳一次錯誤窗。

    那一刻跳不出來:伺服器端沒有畫面,彈窗要有人渲染才看得見 ——
    不存起來的話,那個錯誤就這樣消失了,使用者看到的是一頁空的內容,
    而畫面上沒有任何訊息說發生過什麼事。

    **只有會在伺服器端先跑一次的專案需要它。** 純瀏覽器端的那一份範本
    沒有這個欄位,它的錯誤當場就跳得出來,存起來反而多一段沒有人清的狀態。
    兩份範本在這裡刻意不同。 */
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
    defaultSetClass,
    defaultOptions,
    teleportTarget,
    alertData,
    confirmData,
    customData,
    apiPromiseData,
    apiError,
  }
})
