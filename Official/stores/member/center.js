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
  //
  // api 目前回不到資料,所以先帶一份假的把版面撐起來 —— tabs 的 category 對應下面
  // noticeTabs 的那五個值。未讀數刻意給三種:兩位數、破百(徽章要放得下)、0(不顯示徽章)。
  // api 通了之後這一份改回 null。
  const noticeSummary = ref({
    data: {
      tabs: [
        { category: 0, unreadCount: 12 },
        { category: 1, unreadCount: 128 },
        { category: 2, unreadCount: 0 },
        { category: 3, unreadCount: 3 },
        { category: 4, unreadCount: 0 },
      ],
    },
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
    searchSubscribe: {
      page: 1,
      pageSize: LIST_PAGE_SIZE,
    },
    actualSubscribe: {
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
  // api 目前回不到資料,所以先帶一份假的把版面撐起來,api 通了之後這一份改回 null。
  //
  // 欄位怎麼對是照 swagger 的名字推的(NotificationItem 沒有說明與範例):
  // 物件資料取 house(BuyListItem)、降價金額取 priceDropAmount、時間取 sentAt。
  // 拿到範例 response 之後要照實際的值再對一次。
  //
  // 時間用「現在往前推」算,秒、分、時、天、日期五種顯示各有一筆;
  // 另外刻意放了已讀、沒有社區、沒有降價金額、沒有分機各一筆。
  const price = ref({
    data: {
      category: 0,
      paging: {
        page: 1,
        pageSize: LIST_PAGE_SIZE,
        total: 5,
      },
      items: [
        {
          id: '1',
          isRead: false,
          category: 0,
          title: '百忍邊間黃金三樓新店琪琪',
          sentAt: new Date(Date.now() - 30 * 1000).toISOString(),
          priceDropAmount: 120,
          tags: [],
          house: {
            id: '1',
            hfid: 'H0000001',
            title: '百忍邊間黃金三樓新店琪琪',
            address: '台北市北投區泉源路華南巷',
            community: { id: '1', name: '美之城社區' },
            price: 21088,
            lastPrice: 21208,
            media: { images: [] },
            broker: {
              name: '郝惠邁',
              brand: '永慶房屋(股)公司',
              phone: '02-12345678',
              extension: '1234',
            },
          },
          actions: [],
        },
        {
          id: '2',
          isRead: false,
          category: 0,
          title: '正義車站 × 文山特區｜綠廳院',
          sentAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          priceDropAmount: 300,
          tags: [],
          house: {
            id: '2',
            hfid: 'H0000002',
            title: '正義車站 × 文山特區｜綠廳院',
            address: '台北市北投區泉源路華南巷',
            community: { id: '2', name: '嘩啦啦美之城社區' },
            price: 3280,
            lastPrice: 3580,
            media: { images: [] },
            broker: {
              name: '王大明',
              brand: '信義房屋',
              phone: '02-87654321',
              extension: null,
            },
          },
          actions: [],
        },
        {
          id: '3',
          isRead: true,
          category: 0,
          title: '忠誠四房車大降價屋主急售低於行情隨時可看',
          sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          priceDropAmount: 80,
          tags: [],
          house: {
            id: '3',
            hfid: 'H0000003',
            title: '忠誠四房車大降價屋主急售低於行情隨時可看',
            address: '新北市新店區北新路三段',
            community: null,
            price: 1580,
            lastPrice: 1660,
            media: { images: [] },
            broker: {
              name: '林小美',
              brand: '永慶不動產',
              phone: '02-22223333',
              extension: '88',
            },
          },
          actions: [],
        },
        {
          id: '4',
          isRead: true,
          category: 0,
          title: '大安森林公園景觀三房',
          sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          priceDropAmount: null,
          tags: [],
          house: {
            id: '4',
            hfid: 'H0000004',
            title: '大安森林公園景觀三房',
            address: '台北市大安區新生南路二段',
            community: { id: '4', name: '森林苑' },
            price: 5680,
            lastPrice: null,
            media: { images: [] },
            broker: {
              name: '陳志明',
              brand: '有巢氏房屋',
              phone: '02-27001234',
              extension: null,
            },
          },
          actions: [],
        },
        {
          id: '5',
          isRead: true,
          category: 0,
          title: '捷運站旁電梯兩房',
          sentAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          priceDropAmount: 50,
          tags: [],
          house: {
            id: '5',
            hfid: 'H0000005',
            title: '捷運站旁電梯兩房',
            address: '台北市中山區民生東路一段',
            community: { id: '5', name: '民生之星' },
            price: 1950,
            lastPrice: 2000,
            media: { images: [] },
            broker: {
              name: '張雅婷',
              brand: '住商不動產',
              phone: '02-25001234',
              extension: '5',
            },
          },
          actions: [],
        },
      ],
    },
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
  // api 目前回不到資料,所以先帶一份假的把版面撐起來 —— 畫面只讀 mobilePhone
  // (手機就是帳號,只能看不能改)。api 通了之後這一份改回 null。
  const account = ref({
    data: {
      mobilePhone: '0912345678',
    },
    apiData: { ...apiDefault.account },
  })
  // 留言紀錄:data 放清單與分頁資訊。
  //
  // api 目前回不到資料,所以先帶一份假的把版面撐起來。三筆各自撐一種情況:
  // 標題長到要截斷、沒有降價紀錄(時間顯示 --、價格欄只有總價)、欄位缺得最多
  // (沒有經紀人、沒有社區、沒有坪數)。imageUrl 給 null 走找不到圖的那一張,
  // api 通了之後這一份改回 null。
  const message = ref({
    data: {
      paging: {
        page: 1,
        pageSize: LIST_PAGE_SIZE,
        total: 3,
      },
      items: [
        {
          id: '1',
          caseType: '公寓',
          messageSentAt: '2026-01-01T00:00:00',
          priceDropAt: '2026-01-15T00:00:00',
          priceDropAmount: 120,
          broker: {
            name: '郝惠邁',
            shopName: '永慶房屋(股)公司',
            mobilePhone: '02-12345678 # 1234',
          },
          house: {
            id: '1',
            title: '忠誠四房車大降價屋主急售低於行情隨時可看',
            imageUrl: null,
            address: '台北市北投區泉源路華南巷',
            communityName: '嘩啦啦美之城社區',
            buildPing: 20,
            roomText: '2房(室)',
            totalPrice: 21088,
            lastPrice: 13980,
          },
        },
        {
          id: '2',
          caseType: '電梯大樓',
          messageSentAt: '2026-01-05T00:00:00',
          priceDropAt: null,
          priceDropAmount: null,
          broker: {
            name: '王大明',
            shopName: '信義房屋',
            mobilePhone: '02-87654321',
          },
          house: {
            id: '2',
            title: '捷運三分鐘電梯兩房',
            imageUrl: null,
            address: '新北市板橋區文化路一段',
            communityName: '文化名邸',
            buildPing: 32,
            roomText: '2房(室)',
            totalPrice: 1680,
            lastPrice: null,
          },
        },
        {
          id: '3',
          caseType: null,
          messageSentAt: '2026-01-10T00:00:00',
          priceDropAt: null,
          priceDropAmount: null,
          broker: null,
          house: {
            id: '3',
            title: '南港軟體園區旁透天',
            imageUrl: null,
            address: '台北市南港區三重路',
            communityName: null,
            buildPing: null,
            roomText: '4房(室)',
            totalPrice: 5680,
            lastPrice: null,
          },
        },
      ],
    },
    apiData: { ...apiDefault.message },
  })
  // 物件訂閱管理:data 放清單、分頁資訊,以及一次最多能比較幾筆(compareLimit)。
  //
  // api 目前回不到資料,所以先帶一份假的把版面撐起來。時間欄位是 subscribedAt
  // (留言紀錄那一頁是 messageSentAt),另外每一筆多一個 canCompare ——
  // 第三筆給 false,勾選方塊要停用。compareLimit 給 3,勾超過就不能比。
  // api 通了之後這一份改回 null。
  const houseSubscribe = ref({
    data: {
      paging: {
        page: 1,
        pageSize: LIST_PAGE_SIZE,
        total: 3,
      },
      compareLimit: 3,
      items: [
        {
          id: '1',
          caseType: '公寓',
          subscribedAt: '2026-01-01T00:00:00',
          priceDropAt: '2026-01-15T00:00:00',
          priceDropAmount: 120,
          canCompare: true,
          broker: {
            name: '郝惠邁',
            shopName: '永慶房屋(股)公司',
            mobilePhone: '02-12345678 # 1234',
          },
          house: {
            id: '1',
            title: '忠誠四房車大降價屋主急售低於行情隨時可看',
            imageUrl: null,
            address: '台北市北投區泉源路華南巷',
            communityName: '嘩啦啦美之城社區',
            buildPing: 20,
            roomText: '2房(室)',
            totalPrice: 21088,
            lastPrice: 13980,
          },
        },
        {
          id: '2',
          caseType: '電梯大樓',
          subscribedAt: '2026-01-05T00:00:00',
          priceDropAt: null,
          priceDropAmount: null,
          canCompare: true,
          broker: {
            name: '王大明',
            shopName: '信義房屋',
            mobilePhone: '02-87654321',
          },
          house: {
            id: '2',
            title: '捷運三分鐘電梯兩房',
            imageUrl: null,
            address: '新北市板橋區文化路一段',
            communityName: '文化名邸',
            buildPing: 32,
            roomText: '2房(室)',
            totalPrice: 1680,
            lastPrice: null,
          },
        },
        {
          id: '3',
          caseType: null,
          subscribedAt: '2026-01-10T00:00:00',
          priceDropAt: null,
          priceDropAmount: null,
          canCompare: false,
          broker: null,
          house: {
            id: '3',
            title: '南港軟體園區旁透天',
            imageUrl: null,
            address: '台北市南港區三重路',
            communityName: null,
            buildPing: null,
            roomText: '4房(室)',
            totalPrice: 5680,
            lastPrice: null,
          },
        },
      ],
    },
    apiData: { ...apiDefault.houseSubscribe },
  })
  // 搜尋訂閱管理:data 放清單與分頁資訊。
  //
  // api 目前回不到資料,所以先帶一份假的把版面撐起來 —— 欄位與 swagger 的
  // SearchSubscriptionItem 一致,三筆分別是「設計稿上的五個標籤」「標籤只有兩個」
  // 「標籤多到換行、配對數破萬」。conditionPath 的形狀還沒確認,這裡先照買屋清單的網址擺。
  // api 通了之後這一份改回 null,頁面那一支也要把初次載入加回去。
  const searchSubscribe = ref({
    data: {
      paging: {
        page: 1,
        pageSize: LIST_PAGE_SIZE,
        total: 3,
      },
      items: [
        {
          id: '1',
          conditionPath: '/buy/list/1_region',
          conditionTags: [
            '台北市大安區',
            '捷運大安森林公園站',
            '房間都有窗',
            '管理室代收',
            '總價2000-3000萬',
          ],
          matchedHouseCount: 9999,
          createdAt: '2026-01-01T00:00:00',
        },
        {
          id: '2',
          conditionPath: '/buy/list/2_region',
          conditionTags: ['新北市板橋區', '總價1000-2000萬'],
          matchedHouseCount: 0,
          createdAt: '2026-01-01T00:00:00',
        },
        {
          id: '3',
          conditionPath: '/buy/list/3_region',
          conditionTags: [
            '台北市信義區',
            '台北市松山區',
            '捷運市政府站',
            '捷運國父紀念館站',
            '電梯大樓',
            '三房以上',
            '屋齡十年內',
            '有平面車位',
            '總價3000-5000萬',
          ],
          matchedHouseCount: 12480,
          createdAt: '2026-01-01T00:00:00',
        },
      ],
    },
    apiData: { ...apiDefault.searchSubscribe },
  })
  /* 實登訂閱管理:data 放清單與分頁資訊。

    api 目前回不到資料,所以先帶一份假的把版面撐起來。三筆分別是
    「設計稿上的四個標籤」「標籤只有兩個」「標籤多到換行」。

    **有四個欄位是設計稿要、swagger 的 RealPriceSubscriptionItem 沒有的**:
    加入時間、權狀坪數、總價,以及「查看」要帶去的實登搜尋頁網址。
    照設計稿把版面做出來,那四個名字是暫定的 —— 三個成交數字照 latestUnitPrice
    的形狀取名,時間與網址照搜尋訂閱那一層的 createdAt / conditionPath。
    api 定案之後這幾個名字要跟著改,元件那邊也要一起改。

    反過來 swagger 有、設計稿沒畫的是 regionName、keyword、latestTradeDate,
    畫面上沒有它們的位置,所以不取用。

    api 通了之後這一份改回 null,頁面那一支也要把初次載入加回去。 */
  const actualSubscribe = ref({
    data: {
      paging: {
        page: 1,
        pageSize: LIST_PAGE_SIZE,
        total: 3,
      },
      items: [
        {
          id: '1',
          conditionPath: '/actual-price/list/1_region',
          conditionTags: ['台北市大安區', '捷運大安森林公園站', '房間都有窗', '管理室代收'],
          latestBuildPing: 29.8,
          latestTotalPrice: 3000,
          latestUnitPrice: 100.05,
          createdAt: '2026-01-01T00:00:00',
        },
        {
          id: '2',
          conditionPath: '/actual-price/list/2_region',
          conditionTags: ['新北市板橋區', '總價1000-2000萬'],
          latestBuildPing: 45.2,
          latestTotalPrice: 1680,
          latestUnitPrice: 37.17,
          createdAt: '2026-01-05T00:00:00',
        },
        {
          id: '3',
          conditionPath: '/actual-price/list/3_region',
          conditionTags: [
            '台北市信義區',
            '台北市松山區',
            '捷運市政府站',
            '捷運國父紀念館站',
            '電梯大樓',
            '三房以上',
            '屋齡十年內',
            '有平面車位',
          ],
          latestBuildPing: 68.4,
          latestTotalPrice: 12480,
          latestUnitPrice: 182.45,
          createdAt: '2026-01-10T00:00:00',
        },
      ],
    },
    apiData: { ...apiDefault.actualSubscribe },
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
    searchSubscribe,
    actualSubscribe,
  }
})
