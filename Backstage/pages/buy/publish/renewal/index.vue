<script setup>
// const common = useCommonStore()
const { onWithLoadingAll } = useCommonActions()

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})

await onWithLoadingAll([])
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

<style></style>
