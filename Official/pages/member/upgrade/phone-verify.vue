<script setup>
import { EMAILVERIFYTOKEN, PHONE, PHONEEXCEEDED } from '@js/_storage.js'
import { onMaskPhone } from '@js/_projectPrototype.js'
import { deCryptoJSON } from '@js/_crypto/index.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberUpgrade = useMemberUpgradeStore()
const { phone, phoneVerify } = storeToRefs(memberUpgrade)
const {
  onGetCookie,
  onApiAuthEmailUpgradeMobileVerificationCode,
  onApiAuthEmailUpgradeMobileVerificationCodeVerify,
  onApiAuthEmailUpgradeBind,
  onApiAuthEmailUpgradeMerge,
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
      const exceededRaw = useCookie(PHONEEXCEEDED).value

      // verificationToken 只活在 store(沒有寫 cookie),重整後必然是空的 →
      // 本頁的驗證與重送都缺這個值,畫面只會停在「驗證碼已失效」。
      // 與其讓使用者卡在死畫面,不如退回上一頁重新輸入號碼、重新發送。
      const { phoneVerify } = useMemberUpgradeStore()

      // 沒有 upgradeToken(未經上一頁進來、或已過 expiresAt 被瀏覽器清掉)→
      // 後續 mobile API 都缺 header X-Upgrade-Token,打不了,退回上一頁重跑。
      // 已達發送上限也一樣退回,由上一頁呈現超限狀態。
      if (
        !raw ||
        !deCryptoJSON(raw) ||
        (exceededRaw && deCryptoJSON(exceededRaw)) ||
        !phoneVerify.apiData.verificationToken
      ) {
        return navigateTo(
          {
            name: 'member-upgrade-phone',
          },
          {
            replace: true,
          }
        )
      }
    },
  ],
})

const apiData = computed(() => phoneVerify.value.apiData)
// 只用於顯示;要打 API 時請用未遮蔽的 apiData.mobilePhone
const maskPhone = computed(() => onMaskPhone(phone.value.apiData.mobilePhone))

await onWithLoadingAll([])

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 驗證手機驗證碼。回傳 availability 給下一段決定要綁定還是整併 —— 驗證失敗回 null。
// loading 由這裡開啟;通過時「不關」,留給接續的綁定 / 整併收尾,
// 中間才不會閃一次關閉再開啟,失敗則在這裡自己關掉。
const onAuthEmailUpgradeMobileVerificationCodeVerify = async () => {
  onApiPromise('open')

  const { status, data } = await onApiAuthEmailUpgradeMobileVerificationCodeVerify()

  if (status === 200) return data?.availability ?? null

  onApiPromise('close')

  return null
}

// 完成升級 → 進完成頁。承接上一段未關的 loading。
//
// 走綁定還是整併,看驗證當下回的 availability(2 = 已是手機會員 → 整併)。
// 用它而不是把上一頁的 requiresMerge 傳過來:這是「驗證的那一刻」的最新狀態,
// 也省掉一份要跨頁維護的旗標。能走到本頁的組合只有 0/1(綁定)與 2(整併),兩者互斥。
const onAuthEmailUpgradeComplete = async (availability) => {
  const { status } =
    availability === 2 ? await onApiAuthEmailUpgradeMerge() : await onApiAuthEmailUpgradeBind()

  onApiPromise('close')

  if (status !== 200) return

  router.push({
    name: 'member-upgrade-complete',
  })
}

const onReSend = async () => {
  onApiPromise('open')

  const { status } = await onApiAuthEmailUpgradeMobileVerificationCode()

  onApiPromise('close')

  // 已達發送上限 → 退回上一頁呈現(PHONEEXCEEDED cookie 已由 store action 寫好)
  if (status !== 429) return

  await navigateTo(
    {
      name: 'member-upgrade-phone',
    },
    {
      replace: true,
    }
  )
}

// 驗證通過 → 接著綁定 / 整併完成升級。兩支是同一個動作的兩段,loading 一路包到底。
const onSumit = async () => {
  const availability = await onAuthEmailUpgradeMobileVerificationCodeVerify()

  if (availability === null) return

  await onAuthEmailUpgradeComplete(availability)
}

// upgradeToken 與手機號碼都由上一頁寫進 cookie;本頁 URL 不帶這兩個值,
// 改由 cookie 取回還原到 store。cookie SSR 讀得到 → 重整後仍在。
// token 走到這裡代表 middleware 已放行 → 一定有效;號碼供顯示與驗證 API 使用。
const onInit = () => {
  const mobilePhone = onGetCookie(PHONE)

  phone.value.token = onGetCookie(EMAILVERIFYTOKEN)
  phone.value.apiData.mobilePhone = mobilePhone
  apiData.value.mobilePhone = mobilePhone
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
    <PageMemberUpgradeHeader
      title="輸入簡訊驗證碼"
      :setClass="{
        main: 'text-center',
      }"
    >
      <template #description>
        <div class="flex items-center justify-center gap-x-[10px]">
          <p>驗證碼已發送至 {{ maskPhone }}</p>
          <CommonMAnchor
            text="修改號碼"
            :to="{
              name: 'member-upgrade-phone',
            }"
            :setClass="{
              main: 'underline',
            }"
          />
        </div>
      </template>
    </PageMemberUpgradeHeader>
    <PageMemberUpgradePhoneVerifyContent @reSend="onReSend" @submit="onSumit" />
  </CommonMContainer>
</template>

<style lang="postcss"></style>
