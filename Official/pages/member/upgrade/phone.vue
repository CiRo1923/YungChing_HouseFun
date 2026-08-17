<script setup>
import { EMAILVERIFYTOKEN, PHONEEXCEEDED } from '@js/_storage.js'
import { deCryptoJSON } from '@js/_crypto/index.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberUpgrade = useMemberUpgradeStore()
const { phone } = storeToRefs(memberUpgrade)
const {
  onGetCookie,
  onClearCookie,
  onApiAuthEmailUpgradeMobileCheck,
  onApiAuthEmailUpgradeMobileVerificationCode,
  onPopupCustomer,
  reset,
} = useMemberUpgradeActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
  middleware: [
    () => {
      const raw = useCookie(EMAILVERIFYTOKEN).value

      // 沒有 upgradeToken(未經 email 驗證進來、或已過 expiresAt 被瀏覽器清掉)→
      // mobile API 都缺 header X-Upgrade-Token,打不了,退回 email 那步重跑
      if (!raw || !deCryptoJSON(raw)) {
        return navigateTo(
          {
            name: 'member-upgrade-email',
          },
          {
            replace: true,
          }
        )
      }
    },
  ],
})

// details 只取第一筆(後端第一筆即為要呈現的原因),後面的忽略
const exceededMessage = computed(() => {
  const { details, message } = phone.value.apiResult ?? {}

  return [details?.[0], message].filter(Boolean).join('<br />')
})

await onWithLoadingAll([])

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 檢查號碼可不可以繼續,回傳 true 才往下發驗證碼。
//
// availability:0 新使用者 / 1 已有 email 帳號與手機(手機尚未綁定 email) / 2 已是手機會員
//
//   availability | requiresMerge | 動作
//   0 或 1       | false         | 手機驗證流程
//   0 或 1       | true          | 客服 popup
//   2            | true          | 導到整併頁,由使用者選擇合併或改號碼
//   2            | false         | 客服 popup
//
// 以白名單判斷可繼續的組合:availability 若出現預期外的值,一律導向客服而不是放行。
//
// loading 由這裡開啟;可繼續時「不關」,留給接續的發送驗證碼收尾,
// 中間才不會閃一次關閉再開啟,其餘出口都在這裡自己關掉。
const onAuthEmailUpgradeMobileCheck = async () => {
  const CAN_VERIFY_AVAILABILITY = [0, 1]

  onApiPromise('open')

  const { status, data } = await onApiAuthEmailUpgradeMobileCheck()

  if (status !== 200) {
    onApiPromise('close')
    return false
  }

  const { availability, requiresMerge } = data ?? {}

  if (CAN_VERIFY_AVAILABILITY.includes(availability) && requiresMerge === false) return true

  onApiPromise('close')

  // 已是手機會員且需要整併 → 導到整併頁說明並讓使用者選(合併帳號 / 改用其他號碼)。
  // 號碼已由 mobile/check 寫進 PHONE cookie,那頁重整時靠它還原並重新確認狀態。
  if (availability === 2 && requiresMerge === true) {
    router.push({
      name: 'member-upgrade-merge',
    })

    return false
  }

  // 其餘無法繼續的組合一律轉客服(統一的 popup 在 useUpgradeActions)
  await onPopupCustomer()

  return false
}

// 發送驗證碼 → 成功才進驗證頁。承接上一段未關的 loading。
const onAuthEmailUpgradeMobileVerificationCode = async () => {
  const { status } = await onApiAuthEmailUpgradeMobileVerificationCode()

  onApiPromise('close')

  if (status !== 200) return

  router.push({
    name: 'member-upgrade-phone-verify',
  })
}

// 超限是綁「這支號碼」而不是綁人 → 給一個回到表單的出口,讓使用者改用其他帳號。
// 清掉 cookie 只是把畫面切回輸入,沒有繞過限制:同一支號碼再送一次,
// API 仍會回 429 並重新寫入 cookie。
const onClearData = () => {
  onClearCookie(PHONEEXCEEDED)

  phone.value.apiResult = null
}

// 檢查號碼 → 可直接綁定才發送驗證碼。兩支是同一個動作的兩段,loading 一路包到底。
const onSumit = async () => {
  const canVerify = await onAuthEmailUpgradeMobileCheck()

  if (!canVerify) return

  await onAuthEmailUpgradeMobileVerificationCode()
}

// upgradeToken 由上一頁(email 驗證成功)寫進 cookie;本頁 URL 不帶這個值,
// 改由 cookie 取回還原到 store,mobile/check 才有 header X-Upgrade-Token 可帶。
// cookie SSR 讀得到 → 重整後仍在;未經上一頁進來或已失效時為 null。
//
// 發送次數已達上限(429)時會寫 PHONEEXCEEDED cookie(效期到後端給的 unlockAt),
// 一進頁面就取回還原到 apiResult,重整 / 換頁 / 返回都能保持「已超限」的呈現。
// 未超限或已解鎖(瀏覽器自動清掉 cookie)時為 null。
const onInit = () => {
  reset.onPhone()

  phone.value.token = onGetCookie(EMAILVERIFYTOKEN)
  phone.value.apiResult = onGetCookie(PHONEEXCEEDED)
}

onInit()
</script>

<template>
  <CommonMContainer
    class="p:--max-w-400 space-y-[30px] tm:pt-[20px] p:pt-[55px]"
    :config="{
      as: 'section',
    }"
  >
    <template v-if="!phone.apiResult">
      <PageMemberUpgradeHeader
        title="帳號升級"
        :config="{
          description: '新版好房網改以手機號碼登入<br />請驗證您的手機完成升級',
        }"
        :setClass="{
          main: 'text-center',
        }"
      />
      <PageMemberUpgradePhoneContent @submit="onSumit" />
    </template>
    <PageMemberUpgradeExceeded :message="exceededMessage" v-if="phone.apiResult">
      <CommonMAnchor
        text="使用其他帳號升級"
        :setClass="{
          main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
          text: 'text-[16px]',
        }"
        @click="onClearData()"
      />
    </PageMemberUpgradeExceeded>
  </CommonMContainer>
  <PageMemberUpgradePopupCustomer />
</template>

<style lang="postcss"></style>
