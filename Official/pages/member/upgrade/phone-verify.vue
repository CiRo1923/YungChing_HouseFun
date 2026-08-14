<script setup>
import { EMAILVERIFYTOKEN, PHONE } from '@js/_storage.js'
import { onMaskPhone } from '@js/_projectPrototype.js'
import { deCryptoJSON } from '@js/_crypto/index.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberUpgrade = useMemberUpgradeStore()
const { phone, phoneVerify } = storeToRefs(memberUpgrade)
const {
  onGetCookie,
  onApiAuthEmailUpgradeMobileVerificationCode,
  onApiAuthEmailUpgradeMobileVerificationCodeVerify,
} = useMemberUpgradeActions()
const { onApiPromise } = usePopupActions()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
  middleware: [
    () => {
      const raw = useCookie(EMAILVERIFYTOKEN).value

      // 沒有 upgradeToken(未經上一頁進來、或已過 expiresAt 被瀏覽器清掉)→
      // 後續 mobile API 都缺 header X-Upgrade-Token,打不了,退回上一頁重跑
      if (!raw || !deCryptoJSON(raw)) {
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

const onReSend = async () => {
  onApiPromise('open')
  await onApiAuthEmailUpgradeMobileVerificationCode()
  onApiPromise('close')
}

const onSumit = async () => {
  onApiPromise('open')
  const { status } = await onApiAuthEmailUpgradeMobileVerificationCodeVerify()
  onApiPromise('close')

  if (status === 200) {
    // TODO: 驗證成功後的去向尚未確認,補上導頁
  }
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
