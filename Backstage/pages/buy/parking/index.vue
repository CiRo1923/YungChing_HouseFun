<script setup>
import Container from '@components/buy/mContainer.vue'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})
</script>

<template>
  <Container
    :setClass="{
      main: '--px-16',
    }"
  >
    <NuxtLink
      :to="{
        name: 'buy-basic',
      }"
    >
      basic
    </NuxtLink>
  </Container>
</template>

<style></style>
