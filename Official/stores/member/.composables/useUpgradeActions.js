import {
  apiAuthEmailUpgradeVerificationCode,
  apiAuthEmailUpgradeVerificationCodeVerify,
  apiAuthEmailUpgradeMobileCheck,
  apiAuthEmailUpgradeMobileVerificationCode,
  apiAuthEmailUpgradeMobileVerificationCodeVerify,
  apiAuthEmailUpgradeBind,
  apiAuthEmailUpgradeMerge,
} from '@js/_api/member/upgrade.js'
import { enCrypto, deCryptoJSON } from '@js/_crypto/index.js'
import {
  EMAILVALUE,
  EMAILVERIFY,
  EMAILVERIFYTOKEN,
  EMAILEXCEEDED,
  PHONE,
  PHONEEXCEEDED,
  UPGRADECOMPLETE,
} from '@js/_storage.js'

export default () => {
  const memberUpgrade = useMemberUpgradeStore()
  const { email, emailVerify, phone, phoneVerify, bind, merge } = storeToRefs(memberUpgrade)
  const { onApiError, onAlert, onCustom } = usePopupActions()
  // 在 setup 期間先取好:action 是在事件處理器、且多半在 await 之後才執行,
  // 那時直接呼叫 navigateTo / useRouter 可能已經沒有 Nuxt context。
  const router = useRouter()

  const onApiAuthEmailUpgradeVerificationCode = async () => {
    const { apiData } = email.value
    const { config, status, data } = await apiAuthEmailUpgradeVerificationCode(apiData)

    email.value.apiResult = null

    // 重送會換一組全新的驗證碼 → 上一組的驗證結果(含 remainingAttempts)一併作廢,
    // 不清的話畫面會拿舊的「錯誤達 5 次」去判斷新驗證碼,顯示成已失效。
    emailVerify.value.apiResult = null

    // 各狀態互斥處理:以 else if 串接,新增狀態只要插一段,不必再維護「排除清單」
    // (排除清單與 === 判斷是兩套邏輯,漏改就會互相覆蓋成死碼)。
    if (status === 200) {
      const { challengeToken, resendAvailableAt } = data
      const expires = new Date(resendAvailableAt)
      const isValidExpires = !Number.isNaN(expires.getTime())

      // 本次流程直接用 store;cookie 則是為了重整 / 換頁後還原(下一頁驗證要帶 challengeToken,
      // 但 URL 不帶)。cookie 效期跟隨 resendAvailableAt,時間到瀏覽器自動清掉,不必自己排程;
      // 值無效時退為 session cookie(關瀏覽器即失效)。
      emailVerify.value.apiData.challengeToken = challengeToken

      // 重送倒數的到期時間。重送成功會拿到新的值 → 倒數元件 watch 到就覆蓋重算
      emailVerify.value.countdownData.expires = resendAvailableAt

      // 驗證通過才寫 cookie:驗證碼需要 email
      onSetCookie(EMAILVALUE, email.value.apiData.email)

      // resendAvailableAt 也一起寫進值裡:cookie 的 expires 讀不回來,而倒數元件需要這個
      // 絕對到期時間才能在 SSR(首屏)就算出剩餘秒數,不必等 client 掛載後才補算
      onSetCookie(
        EMAILVERIFY,
        { challengeToken, resendAvailableAt },
        isValidExpires ? { expires } : {}
      )

      // 發得出去就代表已解鎖(改用其他 email、或後端的鎖已過期)→ 清掉超限紀錄,
      // 否則 cookie 還在,回上一頁 / 重整會被 middleware 擋回去看到「已達上限」
      onClearCookie(EMAILEXCEEDED)
    } else if (status === 400 || status === 404) {
      // 後端有給明確原因的可預期錯誤 → 只顯示 message,不套用通用錯誤彈窗
      const { message } = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status === 429) {
      // 太頻繁 → 不彈窗,交回頁面自行呈現(例如接上重送倒數)
      email.value.apiResult = data

      // 發送次數已達上限 → 寫 cookie,讓重整 / 換頁 / 返回都還原得回「已超限」狀態。
      // 效期用後端給的 unlockAt(解鎖時間),時間到瀏覽器自動清掉,不必自己判斷何時解除;
      // 值無效時退為 session cookie(關瀏覽器即失效)。
      const unlockAt = new Date(data.unlockAt)
      const isValidUnlockAt = !Number.isNaN(unlockAt.getTime())

      onSetCookie(EMAILEXCEEDED, data, isValidUnlockAt ? { expires: unlockAt } : {})

      // 已超限就沒有可續用的驗證流程 → 一併清掉 email 與 challengeToken(重送倒數的
      // 到期時間就存在 EMAILVERIFY 裡,一起消失),避免下次進頁面又用舊資料把驗證畫面撐起來。
      //
      // upgradeToken 也要清:超限代表「這一輪 email 流程作廢」,它發出的通行證不該還能用,
      // 否則已驗證過的人回頭重送到超限後,仍能憑舊 token 前進到 phone 繼續升級。
      // 清掉之後 phone / phone-verify 的 middleware 會自然把人退回 email,不必各自再判斷一次。
      onClearCookie(EMAILVALUE, EMAILVERIFY, EMAILVERIFYTOKEN)
    } else {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiAuthEmailUpgradeVerificationCodeVerify = async () => {
    const { apiData } = emailVerify.value
    const { config, status, data } = await apiAuthEmailUpgradeVerificationCodeVerify(apiData)

    emailVerify.value.apiResult = null

    if (status === 200) {
      // 驗證通過會拿到 upgradeToken:後續 mobile/* 要放進 header X-Upgrade-Token。
      // 本次流程直接用 store;cookie 則是為了重整 / 換頁後還原(下一頁 URL 不帶這個值)。
      // cookie 效期跟隨 expiresAt(token 的失效時間),時間到瀏覽器自動清掉,不必自己排程;
      // 值無效時退為 session cookie(關瀏覽器即失效)。
      const { upgradeToken, expiresAt } = data
      const expires = new Date(expiresAt)
      const isValidExpires = !Number.isNaN(expires.getTime())

      phone.value.token = upgradeToken

      onSetCookie(EMAILVERIFYTOKEN, upgradeToken, isValidExpires ? { expires } : {})
    } else if (status === 400) {
      // 後端有給明確原因的可預期錯誤 → 只顯示 message,不套用通用錯誤彈窗
      const { message } = data

      emailVerify.value.apiResult = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status !== 200) {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiAuthEmailUpgradeMobileCheck = async () => {
    if (!onCheckUpgradeToken()) return memberUpgrade.apiTokenInvalid

    const { apiData } = phone.value
    const { config, status, data } = await apiAuthEmailUpgradeMobileCheck(
      apiData,
      onUpgradeTokenConfig()
    )

    phone.value.apiResult = null

    if (status === 200) {
      // 結果留給整併頁判斷要不要重打一次 check(換頁時 store 還在,重整才會沒有)
      phone.value.checkResult = data

      // 號碼通過檢查就寫 cookie(不是等發驗證碼才寫):整併頁與驗證碼頁的 URL 都不帶號碼,
      // 重整後要靠它還原,整併頁也需要它才能重新確認狀態。
      onSetCookie(PHONE, apiData.mobilePhone)
    } else if (status === 401 || status === 403) {
      // upgradeToken 已失效 → 整條流程作廢,退回起點
      onUpgradeTokenInvalid()
    } else if (status === 400 || status === 404 || status === 409) {
      // 後端有給明確原因的可預期錯誤(格式不符 / 查無資料 / 號碼已被使用)→
      // 只顯示 message,不套用通用錯誤彈窗。
      //
      // 不寫進 apiResult:那是給「整頁換成超限呈現」用的,號碼打錯這種錯誤
      // 若寫進去,輸入表單會整個被取代掉,使用者連改都沒得改。
      const { message } = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status !== 200) {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiAuthEmailUpgradeMobileVerificationCode = async () => {
    if (!onCheckUpgradeToken()) return memberUpgrade.apiTokenInvalid

    const { apiData } = phone.value
    const { config, status, data } = await apiAuthEmailUpgradeMobileVerificationCode(
      apiData,
      onUpgradeTokenConfig()
    )

    phone.value.apiResult = null

    if (status === 401 || status === 403) {
      // upgradeToken 已失效 → 整條流程作廢,退回起點
      onUpgradeTokenInvalid()
    } else if (status === 200) {
      // 驗證時要帶回 verificationToken。
      //
      // 為什麼不用 expiresAt(verificationToken 的到期時間):倒數結束後使用者會重新發送,
      // 那時會拿到新的 verificationToken,舊的自然作廢 → token 的生命週期實際上由「重送」
      // 決定。與 email 那支一致,一律以 resendAvailableAt 為準。
      const { verificationToken, developmentVerificationCode, resendAvailableAt } = data

      phoneVerify.value.apiData.verificationToken = verificationToken

      // 重送倒數的到期時間。重送成功會拿到新的值 → 倒數元件 watch 到就覆蓋重算
      phoneVerify.value.countdownData.expires = resendAvailableAt

      // 後端只在 dev 環境回 developmentVerificationCode(正式環境不回)→ 直接接,
      // 不必自己判斷環境。沒有值時補 null,與 apiDefault 的型別一致
      // (undefined 會讓 v-model 綁的輸入框變成非受控)
      phoneVerify.value.apiData.verificationCode = developmentVerificationCode ?? null

      // 號碼 cookie 在 mobile/check 成功時就寫好了,這裡不用重寫。

      // 發得出去就代表已解鎖(改用其他號碼、或後端的鎖已過期)→ 清掉超限紀錄
      onClearCookie(PHONEEXCEEDED)
    } else if (status === 400 || status === 404) {
      // 後端有給明確原因的可預期錯誤 → 只顯示 message,不套用通用錯誤彈窗。
      // 同上,不寫進 apiResult,免得輸入表單被超限呈現取代掉。
      const { message } = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status === 429) {
      // 太頻繁 → 不彈窗,交回頁面自行呈現(整頁換成超限畫面)。
      // 用 PHONEEXCEEDED 而不是 email 那支 EMAILEXCEEDED:兩者共用會互相污染
      // (email 超限會讓 phone 頁也顯示超限,反之亦然)。
      phone.value.apiResult = data

      const unlockAt = new Date(data.unlockAt)
      const isValidUnlockAt = !Number.isNaN(unlockAt.getTime())

      onSetCookie(PHONEEXCEEDED, data, isValidUnlockAt ? { expires: unlockAt } : {})

      // 已超限就沒有可續用的驗證流程 → 清掉號碼,避免下次進頁面又用舊資料把驗證畫面撐起來
      onClearCookie(PHONE)
    } else if (status !== 200) {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiAuthEmailUpgradeMobileVerificationCodeVerify = async () => {
    if (!onCheckUpgradeToken()) return memberUpgrade.apiTokenInvalid

    const { apiData } = phoneVerify.value
    const { config, status, data } = await apiAuthEmailUpgradeMobileVerificationCodeVerify(
      apiData,
      onUpgradeTokenConfig()
    )

    phoneVerify.value.apiResult = null

    if (status === 401 || status === 403) {
      // upgradeToken 已失效 → 整條流程作廢,退回起點
      onUpgradeTokenInvalid()
    } else if (status === 200) {
      // 一次性的手機驗證權杖 → 接到下一步(bind / merge)的 apiData。
      // 號碼也一併帶過去:bind / merge 的 req 都要 mobilePhone。
      const { mobileVerificationToken } = data

      bind.value.apiData.mobileVerificationToken = mobileVerificationToken
      bind.value.apiData.mobilePhone = apiData.mobilePhone

      merge.value.apiData.mobileVerificationToken = mobileVerificationToken
      merge.value.apiData.mobilePhone = apiData.mobilePhone
    } else if (status === 400) {
      // 後端有給明確原因的可預期錯誤 → 只顯示 message,不套用通用錯誤彈窗
      const { message } = data

      phoneVerify.value.apiResult = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status !== 200) {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiAuthEmailUpgradeBind = async () => {
    if (!onCheckUpgradeToken()) return memberUpgrade.apiTokenInvalid

    const { apiData } = bind.value
    const { config, status, data } = await apiAuthEmailUpgradeBind(apiData, onUpgradeTokenConfig())

    if (status === 200) {
      onUpgradeCompleted(data)
    } else if (status === 401 || status === 403) {
      // upgradeToken 已失效 → 整條流程作廢,退回起點
      onUpgradeTokenInvalid()
    } else if (status === 400 || status === 404 || status === 409) {
      // 後端有給明確原因的可預期錯誤 → 只顯示 message,不套用通用錯誤彈窗
      const { message } = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status !== 200) {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  // 與 bind 的差別只在「號碼已有帳號」→ 改走整併。回應同型,成功處理共用 onUpgradeCompleted。
  // loading 與 bind 一樣交給呼叫端(phone-verify)控制。
  const onApiAuthEmailUpgradeMerge = async () => {
    if (!onCheckUpgradeToken()) return memberUpgrade.apiTokenInvalid

    const { apiData } = merge.value
    const { config, status, data } = await apiAuthEmailUpgradeMerge(apiData, onUpgradeTokenConfig())

    if (status === 200) {
      onUpgradeCompleted(data)
    } else if (status === 401 || status === 403) {
      // upgradeToken 已失效 → 整條流程作廢,退回起點
      onUpgradeTokenInvalid()
    } else if (status === 400 || status === 404 || status === 409) {
      // 後端有給明確原因的可預期錯誤 → 只顯示 message,不套用通用錯誤彈窗
      const { message } = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status !== 200) {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  // bind / merge 的成功處理完全相同(兩支的 response 同型),抽出來共用。
  const onUpgradeCompleted = (data) => {
    // 回傳的 longToken 刻意不使用:完成頁的設計是請使用者到登入頁重新登入一次,
    // 這裡若寫進 AUTHTOKEN,人已經是登入狀態卻還被要求登入,兩者互相矛盾。
    // (它與 member/auth/token 回的是同一種 SSO 長 token,寫進去就等於直接登入。)
    const { maskedMobile } = data

    // 完成頁要顯示的遮罩號碼,同時兼作那頁的進入憑證:
    // 只有這裡(bind / merge 成功)才寫得出來,所以有值就代表「剛完成升級」。
    // 效期短,讓使用者重整還看得到,過了就自然失效、事後貼網址進不去。
    const completeExpires = new Date(Date.now() + memberUpgrade.completeExpiresMinutes * 60 * 1000)

    onSetCookie(UPGRADECOMPLETE, maskedMobile, { expires: completeExpires })

    // 升級流程到此結束 → 清掉沿路寄放的 cookie,避免返回 / 重整又把流程撐起來
    onClearCookie(EMAILVALUE, EMAILVERIFY, EMAILVERIFYTOKEN, EMAILEXCEEDED, PHONE, PHONEEXCEEDED)
  }
  // 無法繼續升級的統一出口:不論原因(不可延後、號碼狀態不允許 …)都導向同一個客服 popup,
  // 標題與按鈕集中在這裡,各頁只負責決定「什麼時候該開」。
  // 內容在 _components/popup/Customer.vue。
  // TODO: 文案待確認
  const onPopupCustomer = async () =>
    await onCustom({
      id: 'popupMemberCustomer',
      title: '無法繼續升級',
      hasExistClose: false,
      btns: [
        {
          label: '聯繫客服',
          type: 'cancel',
        },
      ],
    })
  // upgradeToken 失效的統一出口:整條 email 流程作廢 → 清掉沿路 cookie 並退回起點。
  // 兩種情況會走到這裡:送出前發現 cookie 已被瀏覽器清掉、或後端回 401 / 403。
  const onUpgradeTokenInvalid = () => {
    phone.value.token = null

    onClearCookie(EMAILVALUE, EMAILVERIFY, EMAILVERIFYTOKEN, PHONE)

    onAlert({
      content: '流程已逾時<br />請重新開始',
      setClass: {
        main: 'pt:--w-460',
      },
    })

    router.replace({
      name: 'member-upgrade-email',
    })
  }

  // 送出前的防呆:middleware 只在「進入頁面」檢查一次,停留期間 cookie 可能已到期
  // 被瀏覽器清掉,而 store 的 token 是進頁面時讀的、不會跟著消失。
  // 這裡以 cookie 為準重新取值,順便把 store 補成最新。
  const onCheckUpgradeToken = () => {
    const token = onGetCookie(EMAILVERIFYTOKEN)

    if (!token) {
      onUpgradeTokenInvalid()

      return false
    }

    phone.value.token = token

    return true
  }

  // upgradeToken 走 header 不走 body,mobile 開頭的 API 都要帶。
  // 無值時整個 headers 省略,免得送出 X-Upgrade-Token: null 讓後端
  // 當成無效 token 而非未帶。
  const onUpgradeTokenConfig = () => {
    const { token } = phone.value

    return token ? { headers: { 'X-Upgrade-Token': token } } : {}
  }
  // cookie 基礎設定,與 member / buy 既有的 cookie 一致(不設 expires → session cookie,
  // 關瀏覽器即失效;SSR 讀得到,換頁 / 重整都還原得回來)。
  // key 由呼叫端傳入,不綁死單一用途 → 同一組工具可存多筆資料。
  const onCookie = (key, options = {}) =>
    useCookie(key, {
      path: '/',
      sameSite: 'lax',
      secure: !import.meta.dev,
      ...options,
    })

  // 存:一律 JSON 序列化後加密再寫入。value 傳 null / undefined 等同清除。
  // options 可覆寫效期等設定,例如 { expires: new Date(...) }。
  const onSetCookie = (key, value, options = {}) => {
    if (value == null) {
      onCookie(key).value = null
      return
    }

    onCookie(key, options).value = enCrypto(JSON.stringify(value))
  }

  // 取:解密還原為物件。無值 / 竄改 / 非 JSON 一律回 null,並順手清掉壞掉的 cookie。
  const onGetCookie = (key) => {
    const raw = onCookie(key).value

    if (!raw) return null

    const data = deCryptoJSON(raw)

    if (!data) {
      onCookie(key).value = null
      return null
    }

    return data
  }

  // 清除:可一次帶多個 key,例如 onClearCookie(EMAILVALUE, EMAILVERIFY)
  const onClearCookie = (...keys) => {
    keys.forEach((key) => {
      onCookie(key).value = null
    })
  }

  const reset = {
    onEmail() {
      email.value.apiData = { ...memberUpgrade.apiDefault.email }
    },
    onEmailVerify() {
      emailVerify.value.apiData = { ...memberUpgrade.apiDefault.emailVerify }

      // apiResult 也要一起清:store 是單例,上一次進頁面留下的 remainingAttempts
      // 會被這次的畫面判斷沿用
      emailVerify.value.apiResult = null
    },
    onPhoneVerify() {
      phoneVerify.value.apiData = { ...memberUpgrade.apiDefault.phoneVerify }

      // apiResult 也要一起清:store 是單例,上一次進頁面留下的 remainingAttempts
      // 會被這次的畫面判斷沿用
      phoneVerify.value.apiResult = null
    },
    onPhone() {
      phone.value.apiData = { ...memberUpgrade.apiDefault.phone }

      // token 一併清掉:store 是單例,重設後才由頁面從 EMAILVERIFYTOKEN cookie 還原,
      // 避免上一輪的舊 token 殘留下來被當成這次的
      phone.value.token = null

      // 重新輸入號碼時,上一支號碼的檢查結果就作廢了
      phone.value.checkResult = null
    },
  }

  return {
    onApiAuthEmailUpgradeVerificationCode,
    onApiAuthEmailUpgradeVerificationCodeVerify,
    onApiAuthEmailUpgradeMobileCheck,
    onApiAuthEmailUpgradeMobileVerificationCode,
    onApiAuthEmailUpgradeMobileVerificationCodeVerify,
    onApiAuthEmailUpgradeBind,
    onApiAuthEmailUpgradeMerge,
    onPopupCustomer,
    onSetCookie,
    onGetCookie,
    onClearCookie,
    reset,
  }
}
