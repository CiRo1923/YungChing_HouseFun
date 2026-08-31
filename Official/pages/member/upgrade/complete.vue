<script setup>
import { UPGRADECOMPLETE } from '@js/_storage.js'
import { deCrypto } from '@js/.crypto/index.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
  middleware: [
    () => {
      const raw = useCookie(UPGRADECOMPLETE).value

      // 這支 cookie 只有 bind / merge 成功時寫得出來,有值即代表「剛完成升級」,
      // 效期一到就失效 → 沒有值就不是從流程走完進來的,導去登入頁
      if (!raw || !deCrypto(raw)) {
        return navigateTo(
          {
            name: 'member-login',
          },
          {
            replace: true,
          }
        )
      }
    },
  ],
})

await onWithLoadingAll([])

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})
</script>

<template>
  <CommonMContainer
    class="p:--max-w-400 space-y-[30px] tm:pt-[20px] p:pt-[55px]"
    :config="{
      as: 'section',
    }"
  >
    <PageMemberUpgradeHeader
      title="升級完成"
      :setClass="{
        main: 'text-center',
      }"
    />
    <PageMemberUpgradeCompleteContent />
    <CommonMAnchor
      text="立即登入"
      :to="{
        name: 'member-login',
      }"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-30 --text-center w-full',
        text: 'text-[16px]',
      }"
    />
  </CommonMContainer>
</template>
