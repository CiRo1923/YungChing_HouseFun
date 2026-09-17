<script setup>
definePageMeta({
  layout: 'buy',
  // 登入機制還沒接上,目前沒有任何地方讀這個值 —— 接上之後由路由守衛依它決定要不要擋
  requiresAuth: true,
  title: '出售物件刊登',
})

</script>

<template>
  <BuyMContainer
    :setClass="{
      main: '--px-16',
    }"
  >
    <NuxtLink
      :to="{
        name: 'buy-publish-basic',
      }"
    >
      basic
    </NuxtLink>
  </BuyMContainer>
</template>
