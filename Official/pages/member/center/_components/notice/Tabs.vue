<script setup>
const route = useRoute()
const memberCenter = useMemberCenterStore()

// 每個 tab 都是獨立頁面(router-link),active 由目前的路由 name 決定。
const active = computed(() => {
  return memberCenter.noticeTabs.findIndex((item) => item.to.name === route.name)
})
</script>

<template>
  <CommonMTabBorderBottom
    :items="memberCenter.noticeTabs"
    :config="{
      active: active,
      containerMode: false,
    }"
    :setClass="{
      main: '--green-8b0d --border-b p:--anchor-px-20 p:--anchor-py-10 tm:--anchor-px-10 t:--anchor-py-5',
      header: 'flex items-center',
      anchor: 'tm:text-[14px] p:text-[16px]',
    }"
  />
</template>
