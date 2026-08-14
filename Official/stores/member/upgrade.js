import { defineStore } from 'pinia'

export const useMemberUpgradeStore = defineStore('memberUpgrade', () => {
  const apiDefault = readonly({
    email: {
      email: null,
    },
    emailVerify: {
      challengeToken: null,
      verificationCode: null,
    },
    phone: {
      mobilePhone: null,
    },
    phoneVerify: {
      mobilePhone: null,
      verificationToken: null,
      verificationCode: null,
    },
  })

  const email = ref({
    apiData: { ...apiDefault.email },
    apiResult: null,
  })

  const emailVerify = ref({
    // expires 放 API 的 resendAvailableAt(可重新發送的時間),供重送倒數用
    countdownData: {
      expires: null,
    },
    apiData: { ...apiDefault.emailVerify },
    apiResult: null,
  })

  const phone = ref({
    // email 驗證成功拿到的 upgradeToken,由 EMAILVERIFYTOKEN cookie 還原;
    // 打 mobile/check 時放進 header X-Upgrade-Token
    token: null,
    apiData: { ...apiDefault.phone },
    apiResult: null,
  })

  const phoneVerify = ref({
    // expires 放 API 的 resendAvailableAt(可重新發送的時間),供重送倒數用
    countdownData: {
      expires: null,
    },
    apiData: { ...apiDefault.phoneVerify },
    apiResult: null,
  })

  return {
    apiDefault,
    email,
    emailVerify,
    phone,
    phoneVerify,
  }
})
