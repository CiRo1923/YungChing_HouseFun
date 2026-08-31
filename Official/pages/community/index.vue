<script setup>
// TODO: 要新建 community 的 layout。
// 原本指定的 layout: 'common' 已連同檔案刪除 —— 那支帶著一整套已棄用的登入邏輯
// (onLoginClick + CommonLoginSyetem),留著會讓人誤以為 login 有兩套實作。
// 在 community layout 建好之前,本頁沒有 layout 包裹,只會渲染頁面內容本身。
definePageMeta({
  requiresAuth: false,
  title: '社區',
})
</script>

<template>Community Index</template>
