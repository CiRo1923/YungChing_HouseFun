import { defineStore } from 'pinia'

export const useMemberUpgradeStore = defineStore('memberUpgrade', () => {
  const apiDefault = readonly({
    index: {
      email: null,
    },
    upgrade: {
      emailVerify: {
        challengeToken: null,
        verificationCode: null,
      },
    },
  })

  const index = ref({
    apiData: { ...apiDefault.index },
  })

  const upgrade = ref({
    emailVerify: {
      // expires 放 API 的 resendAvailableAt(可重新發送的時間),供重送倒數用
      countdownData: {
        expires: null,
      },
      apiData: { ...apiDefault.upgrade.emailVerify },
    },
  })

  return {
    apiDefault,
    index,
    upgrade,
  }
})
