<script setup>
const props = defineProps({
  message: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <PageMemberUpgradeHeader
    title="無法發送驗證碼"
    :setClass="{
      main: 'text-center',
    }"
  />
  <div
    class="rounded-[10px] bg-[--gray-f7] px-[20px] py-[15px] text-center"
    v-html="props.message"
  />
  <ul class="space-y-[20px]">
    <li>
      <CommonMAnchor
        text="聯繫客服"
        :setClass="{
          main: '--h-55 --px-20 --text-gray-666 --oval --border-gray-ccce --text-center w-full',
          text: 'text-[16px]',
        }"
      />
    </li>
    <li>
      <CommonMAnchor
        text="返回登入頁"
        :config="{
          icon: {
            name: 'chevron_left',
            position: 'left',
          },
        }"
        :setClass="{
          main: '--text-gray-333 --text-center w-full gap-x-[3px]',
          text: 'text-[16px]',
          icon: 'h-[16px] w-[16px] p-[2px]',
        }"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
