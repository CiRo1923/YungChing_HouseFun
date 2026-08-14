<script setup>
import { EMAILEXCEEDED } from '@js/_storage.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberUpgrade = useMemberUpgradeStore()
const { email } = storeToRefs(memberUpgrade)
const {
  onGetCookie,
  onClearCookie,
  onApiAuthEmailUpgradeVerificationCode,
  reset,
} = useMemberUpgradeActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
})

// details 只取第一筆(後端第一筆即為要呈現的原因),後面的忽略
const exceededMessage = computed(() => {
  const { details, message } = email.value.apiResult ?? {}

  return [details?.[0], message].filter(Boolean).join('<br />')
})

await onWithLoadingAll([])

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 寄送 email 驗證碼 → 成功才進驗證頁
const onAuthEmailUpgradeVerificationCode = async () => {
  onApiPromise('open')

  const { status } = await onApiAuthEmailUpgradeVerificationCode()

  onApiPromise('close')

  if (status !== 200) return

  router.push({
    name: 'member-upgrade-email-verify',
  })
}

const onSumit = async () => {
  await onAuthEmailUpgradeVerificationCode()
}

// 超限是綁「這個 email」而不是綁人 → 給一個回到表單的出口,讓使用者改用其他 email。
// 清掉 cookie 只是把畫面切回輸入,沒有繞過限制:同一個 email 再送一次,
// API 仍會回 429 並重新寫入 cookie。
const onClearData = () => {
  onClearCookie(EMAILEXCEEDED)

  email.value.apiResult = null
}

// 發送次數已達上限(429)時會寫 EMAILEXCEEDED cookie(效期到後端給的 unlockAt),
// 一進頁面就取回還原到 apiResult,重整 / 換頁 / 返回都能保持「已超限」的呈現。
// 未超限或已解鎖(瀏覽器自動清掉 cookie)時為 null。
const onInit = () => {
  reset.onEmail()

  email.value.apiResult = onGetCookie(EMAILEXCEEDED)
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
    <template v-if="!email.apiResult">
      <PageMemberUpgradeHeader
        title="MAIL 會員升級"
        :config="{
          description: '進行 MAIL 驗證<br />將引導您升級為手機帳號，僅需 1 分鐘',
        }"
        :setClass="{
          main: 'text-center',
        }"
      />
      <PageMemberUpgradeEmailContent @submit="onSumit" />
    </template>
    <PageMemberUpgradeExceeded :message="exceededMessage" v-if="email.apiResult">
      <CommonMAnchor
        text="使用其他 MAIL 會員升級"
        :setClass="{
          main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
          text: 'text-[16px]',
        }"
        @click="onClearData()"
      />
    </PageMemberUpgradeExceeded>
  </CommonMContainer>
</template>

<style lang="postcss"></style>
