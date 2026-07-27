<script setup>
const memberProject = useMemberProjectStore()
const { userData } = storeToRefs(memberProject)
const project = useProjectStore()
const { seo } = storeToRefs(project)
const route = useRoute()

const emits = defineEmits(['login', 'logout'])
// H1:優先用資料型 SEO(project.seo.h1,由 middleware/buySeo 於 SSR 前預抓、client 由頁面更新),
// 沒有時退回頻道靜態標題(route.meta.title,供社區 / 租屋等頻道頁使用)。
const channel = computed(() => {
  const { channel, title } = route.meta

  return {
    name: channel,
    title: title,
  }
})
const h1 = computed(() => seo.value.h1 || channel.value.title)

const logout = readonly([
  {
    id: 'login',
    value: '登入',
  },
  {
    id: 'register',
    value: '註冊',
  },
])

const login = computed(() => {
  const { firstName, lastName } = userData.value

  return [
    {
      id: 'account',
      value: `${firstName}${lastName}`,
    },
    {
      id: 'logout',
      value: '登出',
    },
  ]
})

const onLogin = () => {
  emits('login')
}

const onLogout = () => {
  emits('logout')
}
</script>

<template>
  <header class="l-header relative z-[1] shadow-black-y2-b4">
    <h1 v-if="h1" class="sr-only">{{ h1 }}</h1>
    <CommonMHeader>
      <template #nav>
        <div class="ml-auto shrink-0 self-end p:mb-[12px]">
          <slot>
            <CommonMSeparator
              :items="logout"
              :setClass="{
                main: '--horizontal --gap-x-24 items-center leading-[0]',
              }"
              v-if="!userData"
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
                  @click="onLogin"
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
            <CommonMSeparator
              :items="login"
              :setClass="{
                main: '--horizontal --gap-x-24 items-center leading-[0]',
              }"
              v-if="userData"
            >
              <template #account="{ value }">
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
                />
              </template>
              <template #logout="{ value }">
                <CommonMAnchor
                  :text="value"
                  `
                  :setClass="{
                    main: 'leading-[1.64]',
                    text: 'text-[14px] leading-[1.64]',
                  }"
                  @click="onLogout"
                />
              </template>
            </CommonMSeparator>
          </slot>
        </div>
      </template>
    </CommonMHeader>
  </header>
</template>
