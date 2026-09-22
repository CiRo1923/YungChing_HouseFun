// 會員中心(Member BFF)。
//
// 登入 / 註冊 / 升級 / 忘記密碼那些狀態在 stores/memberAuth/,兩邊對到不同的服務:
// authToken(SSO 長 token)由 Member Auth 發,access.data 是拿它換來的、
// 只有這個服務認得的 bearer token —— 與 buy 的 access 各自獨立,不能互用。
export const useMemberCenterStore = defineStore('memberCenter', () => {
  // 側欄最後兩項要連去買屋清單,路由名稱以那一層持有的為準,不在這裡再寫一次。
  const buyList = useBuyListStore()
  const access = ref({
    data: null,
  })
  // 通知總覽五個分頁的未讀數與保留規則。五頁共用同一份,不屬於其中任何一頁,
  // 所以層名不對應頁面 —— 各分頁自己的清單另外分層。
  const noticeSummary = ref({
    data: null,
  })
  // 通知總覽的五個分頁,每一個都是獨立頁面(tab 是 router-link)。
  const noticeTabs = readonly([
    {
      id: 'price',
      category: 0,
      label: '買屋降價通知',
      to: {
        name: 'member-center-notice-price',
      },
    },
    {
      id: 'match',
      category: 1,
      label: '配對物件新上架',
      to: {
        name: 'member-center-notice-match',
      },
    },
    {
      id: 'communityNew',
      category: 2,
      label: '關注社區新上架',
      to: {
        name: 'member-center-notice-community-new',
      },
    },
    {
      id: 'communityPrice',
      category: 3,
      label: '關注社區新行情',
      to: {
        name: 'member-center-notice-community-price',
      },
    },
    {
      id: 'actualPrice',
      category: 4,
      label: '關注實登新行情',
      to: {
        name: 'member-center-notice-actual-price',
      },
    },
  ])
  // 清單一次取幾筆,會員中心每一份清單都用這個值。
  const LIST_PAGE_SIZE = 20
  // 通知五個分頁的送出參數。category 取自 noticeTabs —— 那是同一個值,不另外寫一份;
  // 層名就是 tab 的 id,兩邊對得起來。
  const apiDefault = readonly({
    ...Object.fromEntries(
      noticeTabs.map(({ id, category }) => [id, { category, page: 1, pageSize: LIST_PAGE_SIZE }])
    ),
    message: {
      page: 1,
      pageSize: LIST_PAGE_SIZE,
    },
    houseSubscribe: {
      page: 1,
      pageSize: LIST_PAGE_SIZE,
    },
    password: {
      currentPassword: null,
      newPassword: null,
      confirmPassword: null,
    },
    account: {
      lastName: null,
      firstName: null,
      email: null,
    },
  })
  const price = ref({
    data: null,
    apiData: { ...apiDefault.price },
  })
  const match = ref({
    data: null,
    apiData: { ...apiDefault.match },
  })
  const communityNew = ref({
    data: null,
    apiData: { ...apiDefault.communityNew },
  })
  const communityPrice = ref({
    data: null,
    apiData: { ...apiDefault.communityPrice },
  })
  const actualPrice = ref({
    data: null,
    apiData: { ...apiDefault.actualPrice },
  })
  // 修改密碼:成功是開彈窗,所以沒有 data。
  // apiResult 放 400 回來的那一份 —— 既有密碼對不對只有後端知道,訊息要顯示在密碼欄位下方。
  const password = ref({
    apiData: { ...apiDefault.password },
    apiResult: null,
  })
  // 帳號管理:data 放 profile 回來的整份(手機帳號要顯示),apiData 只有可改的那三個欄位。
  const account = ref({
    data: null,
    apiData: { ...apiDefault.account },
  })
  // 留言紀錄:data 放清單與分頁資訊。
  const message = ref({
    data: null,
    apiData: { ...apiDefault.message },
  })
  // 物件訂閱管理:data 放清單、分頁資訊,以及一次最多能比較幾筆(compareLimit)。
  //
  // api 目前回不到資料,所以先帶一份假的把版面撐起來 —— 欄位與 swagger 的
  // BuyObjectSubscriptionItem 一致,三筆分別是「有降價」「沒降價」「不能比較」。
  // api 通了之後這一份改回 null。
  const houseSubscribe = ref({
    data: {
      compareLimit: 4,
      paging: {
        page: 1,
        pageSize: LIST_PAGE_SIZE,
        total: 3,
      },
      items: [
        {
          id: '1',
          house: {
            id: 'h1',
            title: '忠誠四房車大降價屋主急售',
            address: '台北市北投區泉源路華南巷',
            communityName: '美之城社區',
            totalPrice: 21088,
            lastPrice: 13980,
            unitPrice: 90.6,
            buildPing: 20,
            roomText: '2房(室)',
            floorText: '4/12',
            imageUrl: null,
          },
          broker: {
            name: '郝惠邁',
            mobilePhone: '02-12345678 # 1234',
            shopName: '永慶房屋(股)公司',
          },
          caseType: '公寓',
          subscribedAt: '2026-01-01T00:00:00',
          priceDropAt: '2026-01-01T00:00:00',
          priceDropAmount: 120,
          canCompare: true,
          actions: [],
        },
        {
          id: '2',
          house: {
            id: 'h2',
            title: '邊間四房雙主臥管理美廈',
            address: '台北市萬華區康定路',
            communityName: '晶麒社區',
            totalPrice: 2800,
            lastPrice: null,
            unitPrice: 86.6,
            buildPing: 28.5,
            roomText: '2房(室)1廳1衛',
            floorText: '4/12',
            imageUrl: null,
          },
          broker: {
            name: '郝惠邁',
            mobilePhone: '02-12345678 # 1234',
            shopName: '永慶房屋(股)公司',
          },
          caseType: '大樓',
          subscribedAt: '2026-01-01T00:00:00',
          priceDropAt: null,
          priceDropAmount: null,
          canCompare: true,
          actions: [],
        },
        {
          id: '3',
          house: {
            id: 'h3',
            title: '運動公園管理美廈 鄰運動公園、無障礙進出方正格局',
            address: '台北市萬華區康定路',
            communityName: null,
            totalPrice: 2800,
            lastPrice: 3100,
            unitPrice: 89,
            buildPing: 28.5,
            roomText: '2房(室)1廳1衛',
            floorText: '4/12',
            imageUrl: null,
          },
          broker: {
            name: '郝惠邁',
            mobilePhone: '02-12345678 # 1234',
            shopName: '永慶房屋(股)公司',
          },
          caseType: '華廈',
          subscribedAt: '2026-01-01T00:00:00',
          priceDropAt: '2026-02-15T00:00:00',
          priceDropAmount: 300,
          canCompare: false,
          actions: [],
        },
      ],
    },
    apiData: { ...apiDefault.houseSubscribe },
  })
  const navs = readonly([
    {
      label: '通知總覽',
      icon: 'icon_mail_point',
      to: {
        name: 'member-center-notice-price',
      },
      // 通知總覽底下還有四個分頁,router-link 的 --active 只認自己那一頁,
      // 所以另外列出這一組要一起亮的路由 name。
      activeNames: noticeTabs.map((item) => item.to.name),
      class: {
        main: '--text-gray-666',
      },
      hasActive: true,
      hasHover: true,
    },
    {
      label: '帳號管理',
      icon: 'icon_account_setting',
      to: {
        name: 'member-center-account',
      },
      class: {
        main: '--text-gray-666',
      },
      hasActive: true,
      hasHover: true,
    },
    {
      label: '密碼管理',
      icon: 'icon_lock',
      to: {
        name: 'member-center-password',
      },
      class: {
        main: '--text-gray-666',
      },
      hasActive: true,
      hasHover: true,
    },
    {
      label: '留言紀錄',
      icon: 'icon_dialogue',
      to: {
        name: 'member-center-message',
      },
      class: {
        main: '--text-gray-666',
      },
      hasActive: true,
      hasHover: true,
    },
    {
      label: '搜尋訂閱管理',
      icon: 'icon_search',
      to: {
        name: 'member-center-search-subscribe',
      },
      class: {
        main: '--text-gray-666',
      },
      hasActive: true,
      hasHover: true,
    },
    {
      label: '物件訂閱管理',
      icon: 'icon_bell',
      to: {
        name: 'member-center-house-subscribe',
      },
      class: {
        main: '--text-gray-666',
      },
      hasActive: true,
      hasHover: true,
    },
    {
      label: '社區訂閱管理',
      icon: 'icon_community',
      to: {
        name: 'member-center-community-subscribe',
      },
      class: {
        main: '--text-gray-666',
      },
      hasActive: true,
      hasHover: true,
    },
    {
      label: '實登訂閱管理',
      icon: 'icon_chart_bar',
      to: {
        name: 'member-center-actual-subscribe',
      },
      class: {
        main: '--text-gray-666',
      },
      hasActive: true,
      hasHover: true,
    },
    {
      label: '物件比一比',
      icon: 'icon_house_compare',
      to: {
        name: 'member-center-house-compare',
      },
      class: {
        main: '--text-gray-666',
      },
      hasActive: true,
      hasHover: true,
    },
    {
      label: '社區比一比',
      icon: 'icon_community_compare',
      to: {
        name: 'member-center-community-compare',
      },
      class: {
        main: '--text-gray-666',
      },
      hasActive: true,
      hasHover: true,
    },
    {
      label: '租屋刊登',
      icon: 'icon_rent_publish',
      to: {
        name: 'rent',
      },
      class: {
        main: '--text-orange-e646',
      },
      hasActive: false,
      hasHover: false,
    },
    {
      // 刊登的落點頁還沒有,先連去買屋清單。
      label: '買屋刊登',
      icon: 'icon_buy_publish',
      to: {
        name: buyList.basicRouteName,
      },
      class: {
        main: '--text-orange-e646',
      },
      hasActive: false,
      hasHover: false,
    },
  ])

  return {
    access,
    navs,
    noticeSummary,
    noticeTabs,
    apiDefault,
    price,
    match,
    communityNew,
    communityPrice,
    actualPrice,
    password,
    account,
    message,
    houseSubscribe,
  }
})
