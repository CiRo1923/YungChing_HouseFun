<script setup>
import { getChannelColorHref } from '@js/runtime/channelColor.js'

// member 頻道色票的 hash URL(集中在 _channelColor 用 ?url 引用)。
const colorHref = getChannelColorHref('member')

const common = useCommonStore()
const { isLoading } = storeToRefs(common)

// 掛載 buy 頻道色票(同步 composable 一律放在 await 之前)
useHead({
  link: [
    {
      rel: 'stylesheet',
      href: colorHref,
    },
  ],
})

</script>

<template>
  <div class="l-wrap">
    <CommonHeader>
      <CommonMAnchor
        text="回首頁"
        :config="{
          icon: {
            name: 'chevron_left',
            position: 'left',
          },
        }"
        :setClass="{
          main: '--oval --border-gray-ccce --h-35 --px-10 gap-x-[5px] text-[--gray-666]',
          text: 'text-[14px]',
          icon: 'h-[16px] w-[16px] p-[2px] text-[--gray-999]',
        }"
      />
    </CommonHeader>
    <main class="l-body relative z-0 tm:mt-[20px] p:mt-[55px]">
      <slot />
    </main>
    <footer class="l-footer">
      <CommonMFooter
        :setClass="{
          main: 'border-t-[1px] border-t-[--gray-e5]',
        }"
      />
    </footer>
    <CommonMLoading
      :config="{
        isFixed: true,
      }"
      v-if="isLoading"
    />
  </div>
  <div id="box">
    <CommonAlertSystem />
    <CommonConfirmSystem />
    <CommonApiPromiseSystem />
  </div>
</template>

<style lang="postcss">
body {
  @apply bg-[--white];
}
</style>
