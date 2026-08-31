<script setup>
// Nuxt 的錯誤頁必須放在 srcDir 根目錄(本專案 pages / components / layouts 都在根,srcDir 即為根)。
// 放在 pages/ 底下只會變成 /error 這個一般路由,showError 不會用它。
//
// ⚠ 刻意不套 <NuxtLayout name="buy">:那個 layout 會 await callOnce(onInit) 打 auth API、
//   SSR 還會預抓 SEO。錯誤頁常常正是 API 出狀況時顯示的,再打一次若又失敗,
//   錯誤頁自己就渲染不出來,只能落到 Nitro 的兜底畫面。這裡維持零外部相依。
const props = defineProps({
  error: {
    type: Object,
    default: () => ({}),
  },
})

const statusCode = computed(() => Number(props.error?.statusCode) || 500)
const isNotFound = computed(() => statusCode.value === 404)

const title = computed(() => (isNotFound.value ? '找不到頁面' : '系統發生錯誤'))
const message = computed(() =>
  isNotFound.value
    ? '您要找的頁面不存在，可能已被移除，或是網址輸入有誤。'
    : '請稍後再試，若持續發生請聯繫客服。'
)

// 錯誤頁是蓋在原本的路由上的,clearError 不帶 redirect 會留在那個壞掉的網址
const onBackClick = () => clearError({ redirect: '/home' })
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-[--white] px-[16px]">
    <div class="text-center">
      <CommonSvgIcon
        icon="icon_exclamation_o"
        class="text-[--gray-999] tm:h-[40px] tm:w-[40px] p:h-[48px] p:w-[48px]"
      />
      <strong
        class="mt-[24px] block font-semibold text-[--gray-333] tm:text-[24px] p:text-[30px]"
        v-html="`${statusCode} ${title}`"
      />
      <p class="mt-[16px] text-[--gray-666] tm:text-[14px] p:text-[16px]">{{ message }}</p>
      <div class="mt-[32px]">
        <CommonMAnchor
          text="回首頁"
          :setClass="{
            main: '--oval --h-45 --px-30 --bg-orange-f74c --text-white',
            text: 'text-[18px] tracking-wider',
          }"
          @click="onBackClick"
        />
      </div>
    </div>
  </div>
</template>
