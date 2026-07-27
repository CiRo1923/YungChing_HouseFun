<script setup>
import { getChannelColorHref } from '@js/runtime/channelColor.js'

const common = useCommonStore()
const { isLoading } = storeToRefs(common)
const { onApiAuthToken } = useMemberProjectActions()
const { onApiBuyAuthTokenExchange, onApiAuthMe } = useBuyProjectActions()
const { onPromise } = usePopupActions()
const { onLogin } = useBuyPopupActions()
const containerRef = ref(null)

const route = useRoute()

const channel = computed(() => {
  const { channel, title } = route.meta
  return {
    name: channel,
    title: title,
  }
})

const account = readonly([
  {
    id: 'login',
    value: '登入',
  },
  {
    id: 'register',
    value: '註冊',
  },
])

const authTokenExchangeMap = {
  buy: onApiBuyAuthTokenExchange,
  // rent: onApiRentAuthTokenExchange,
}

const authMeMap = {
  buy: onApiAuthMe,
  // rent: onApiRentAuthTokenExchange,
}

const onLoginClick = async () => {
  const { name } = channel.value

  if (name !== 'member') {
    const { isSure } = await onLogin()

    if (isSure) {
      const { name } = channel.value

      onPromise('open')

      const { status } = await onApiAuthToken({
        channel: `${name}-web`,
      })

      if (status === 200) {
        await authTokenExchangeMap[name]?.()
        await authMeMap[name]?.()
      }

      // onPromise('close')
    }
  }
}

// 依當前頻道動態掛載色票,切頻道時自動替換
useHead(() => {
  const { name } = channel.value
  const href = getChannelColorHref(name)
  return href
    ? {
        link: [
          {
            rel: 'stylesheet',
            href,
          },
        ],
      }
    : {}
})
</script>

<template>
  <div class="l-wrap">
    <header class="l-header relative z-[1] shadow-black-y2-b4">
      <h1 v-if="channel.title" class="sr-only">{{ channel.title }}</h1>
      <CommonMHeader>
        <template #nav>
          <div class="ml-auto shrink-0 self-end p:mb-[12px]">
            <CommonMSeparator
              :items="account"
              :setClass="{
                main: '--horizontal --gap-x-24 items-center leading-[0]',
              }"
            >
              <template #login="{ value }">
                <CommonMAnchor
                  :text="value"
                  :config="{
                    icon: {
                      name: 'icon_account',
                      position: 'left',
                    },
                  }"
                  :setClass="{
                    main: 'gap-x-[3px]',
                    text: 'text-[14px] leading-[1.64]',
                    icon: 'h-[18px] w-[18px] p-[1px]',
                  }"
                  @click="onLoginClick"
                />
              </template>
              <template #register="{ value }">
                <CommonMAnchor
                  :text="value"
                  `
                  :setClass="{
                    main: 'leading-[1.64]',
                    text: 'text-[14px] leading-[1.64]',
                  }"
                />
              </template>
            </CommonMSeparator>
          </div>
        </template>
      </CommonMHeader>
    </header>
    <main class="l-body relative z-0">
      <slot />
    </main>
    <footer class="l-footer">
      <CommonMFooter />
    </footer>
    <CommonMLoadingMain
      :config="{
        isFixed: true,
      }"
      v-if="isLoading"
    />
  </div>
  <div id="box">
    <CommonAlertSystem />
    <CommonConfirmSystem />
    <CommonLoginSyetem :container="containerRef">
      <!-- 預留之後有不一樣的 login -->
      <CommonLoginContainer ref="containerRef" />
      <template #note>
        <CommonLoginNote />
      </template>
    </CommonLoginSyetem>
    <CommonApiPromiseSystem />
    <!-- <ApiRunSystem /> -->
  </div>
</template>

<style></style>
