<script setup>
const items = readonly([
  {
    content: '之後免記密碼，簡訊即可登入',
  },
  {
    content: '帳號更安全',
  },
  {
    content: '原會員資料完整保留',
  },
])
</script>

<template>
  <div class="rounded-[10px] bg-[--green-ffe9] px-[20px] py-[15px] text-center">
    <ul class="inline-block space-y-[10px] text-left">
      <li
        class="flex items-center gap-x-[5px]"
        v-for="(item, index) in items"
        :key="`${item.content}_${index}`"
      >
        <CommonSvgIcon
          icon="icon_check_solid"
          class="h-[20px] w-[20px] shrink-0 p-[2px] text-[--green-8b0d]"
        />
        <p class="grow text-[16px]" v-html="item.content" />
      </li>
    </ul>
  </div>
</template>
