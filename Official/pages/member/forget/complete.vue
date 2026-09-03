<script setup>
import { FORGETCOMPLETE } from '@js/_storage.js'
import { deCrypto } from '@js/.crypto/index.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
  middleware: [
    () => {
      const raw = useCookie(FORGETCOMPLETE).value

      // 這支 cookie 只有 confirm 成功時寫得出來,所以有值就代表「剛完成重設」。
      // 效期短(store 的 completeExpiresMinutes),過了就自然失效、事後貼網址進不去。
      if (!raw || !deCrypto(raw)) {
        return navigateTo(
          {
            name: 'member-forget',
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
  title: '密碼設定完成 | 好房 HouseFun',
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
    <PageMemberForgetHeader
      title="密碼設定完成"
      :config="{
        step: 3,
      }"
    />
    <PageMemberForgetCompleteContent />
  </CommonMContainer>
</template>
