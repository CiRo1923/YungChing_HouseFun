<script setup>
const common = useCommonStore()
const { isLoading } = storeToRefs(common)
</script>

<template>
  <div class="l-wrap">
    <ProjectHeader>
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
    </ProjectHeader>
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
