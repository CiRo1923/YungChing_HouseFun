<script setup>
const memberCenter = useMemberCenterStore()
const { account } = storeToRefs(memberCenter)

// 手機就是帳號,只能看不能改。
const items = computed(() => [
  { id: 'label', value: '會員帳號' },
  { id: 'mobilePhone', value: account.value.data?.mobilePhone },
])
</script>

<template>
  <div
    class="flex items-center justify-center gap-x-[30px] rounded-[10px] border-[1px] border-[--green-8b0d] p-[30px] shadow-[0_2px_4px_0_var(--black-26)]"
  >
    <CommonMFigure
      src="member/center/account/account.svg"
      alt=""
      :setClass="{
        main: 'h-[36px] w-[28px]',
      }"
    />
    <CommonMSeparator
      :items="items"
      :setClass="{
        main: '--horizontal --gap-x-24 --divider-gray-999',
        item: 'text-[16px] font-bold',
      }"
    />
  </div>
</template>
