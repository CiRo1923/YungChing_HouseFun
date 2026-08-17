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
    // channel 是「發起登入的頻道」,與 definePageMeta 的 channel(頻道色票)無關。
    // 值比照既有登入流程的 `${頻道}-web`(buy 頻道送 buy-web)。
    bind: {
      mobilePhone: null,
      mobileVerificationToken: null,
      channel: 'member-web',
      rememberMe: true,
    },
    merge: {
      mobilePhone: null,
      mobileVerificationToken: null,
      channel: 'member-web',
      rememberMe: true,
    },
  })

  // upgradeToken 失效時,mobile 那幾支 action 給呼叫端的回傳值:
  // 形狀與正常 API 回應一致,status 用 401 → 呼叫端既有的「!== 200 就停下」判斷不必改。
  // UPGRADECOMPLETE cookie 的存活分鐘數。它同時是完成頁的顯示資料與進入憑證:
  // 留一小段時間讓使用者重整仍看得到,過了就自然失效,事後貼網址進不去。
  const completeExpiresMinutes = 5

  const apiTokenInvalid = readonly({
    config: {},
    status: 401,
    data: {},
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
    // mobile/check 的結果(availability / requiresMerge)。整併頁靠它判斷要不要重打一次
    // check:從上一頁導過來時已經有值 → 直接用;重整後是 null → 那時才重新確認號碼狀態。
    checkResult: null,
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

  const bind = ref({
    apiData: { ...apiDefault.bind },
  })

  const merge = ref({
    apiData: { ...apiDefault.merge },
  })

  return {
    apiDefault,
    apiTokenInvalid,
    completeExpiresMinutes,
    email,
    emailVerify,
    phone,
    phoneVerify,
    bind,
    merge,
  }
})
