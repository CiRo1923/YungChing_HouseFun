<script setup>
const memberCenter = useMemberCenterStore()
const { noticeSummary } = storeToRefs(memberCenter)
const route = useRoute()

// 每個 tab 都是獨立頁面(router-link),active 由目前的路由 name 決定。
const active = computed(() => {
  return memberCenter.noticeTabs.findIndex((item) => item.to.name === route.name)
})
// noticeTabs 是靜態設定,未讀數依 category 從 summary 對回來合成一份。
const items = computed(() => {
  const summaryTabs = noticeSummary.value.data?.tabs ?? []

  return memberCenter.noticeTabs.map((item) => ({
    ...item,
    unreadCount: summaryTabs.find((tab) => tab.category === item.category)?.unreadCount ?? 0,
  }))
})
</script>

<template>
  <CommonMTabBorderBottom
    name="noticeTabs"
    :items="items"
    :config="{
      mode: {
        tm: 'select',
      },
      active: active,
      containerMode: false,
    }"
    :setClass="{
      main: '--green-8b0d --border-b p:--anchor-px-20 p:--anchor-py-10 tm:--anchor-px-10 t:--anchor-py-5',
      header: 'flex items-center',
      headerItems: 'pt:w-full',
      headerItem: 'pt:flex-1',
      anchor: 'pt:w-full tm:text-[14px] p:text-[16px]',
      select: {
        main: 'w-full tm:--h-55',
      },
    }"
  >
    <!-- 下拉模式走 MFormSelect,只吃 label 字串,這個插槽不會渲染 -->
    <template #anchor="{ item }">
      <em class="m-tab-anchor-label">{{ item.label }}</em>
      <span
        class="inline-flex min-w-[20px] items-center justify-center rounded-full bg-[--red-d111] px-[5px] py-[2px] text-[12px] leading-none text-[--white]"
        v-if="item.unreadCount"
      >
        {{ item.unreadCount }}
      </span>
    </template>
  </CommonMTabBorderBottom>
</template>
