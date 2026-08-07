<script setup>
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
        <div class="shrink-0 pt:ml-auto pt:self-end p:mb-[12px]">
          <slot>
            <CommonMLogStatus @login="onLogin" @logout="onLogout" />
          </slot>
        </div>
      </template>
    </CommonMHeader>
  </header>
</template>
