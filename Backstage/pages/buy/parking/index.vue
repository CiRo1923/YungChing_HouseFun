<script setup>
import Container from '@components/buy/mContainer.vue'

import { useCommonStore } from '@stores/common.js'

const common = useCommonStore()
const { onWithLoadingAll } = common

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})

await onWithLoadingAll([])
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
