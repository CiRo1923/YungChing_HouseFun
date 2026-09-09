// 會員中心(Member BFF)。
//
// 登入 / 註冊 / 升級 / 忘記密碼那些狀態在 stores/memberAuth/,兩邊對到不同的服務:
// authToken(SSO 長 token)由 Member Auth 發,access.data 是拿它換來的、
// 只有這個服務認得的 bearer token —— 與 buy 的 access 各自獨立,不能互用。
export const useMemberCenterStore = defineStore('memberCenter', () => {
  const access = ref({
    data: null,
  })
  // 通知總覽的五個分頁,每一個都是獨立頁面(tab 是 router-link)。
  const noticeTabs = readonly([
    {
      id: 'price',
      label: '買屋降價通知',
      to: {
        name: 'member-center-notice-price',
      },
    },
    {
      id: 'match',
      label: '配對物件新上架',
      to: {
        name: 'member-center-notice-match',
      },
    },
    {
      id: 'communityNew',
      label: '關注社區新上架',
      to: {
        name: 'member-center-notice-community-new',
      },
    },
    {
      id: 'communityPrice',
      label: '關注社區新行情',
      to: {
        name: 'member-center-notice-community-price',
      },
    },
    {
      id: 'actualPrice',
      label: '關注實登新行情',
      to: {
        name: 'member-center-notice-actual-price',
      },
    },
  ])
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
      class: {
        main: '--text-orange-e646',
      },
      hasActive: false,
      hasHover: false,
    },
    {
      label: '買屋刊登',
      icon: 'icon_buy_publish',
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
    noticeTabs,
  }
})
