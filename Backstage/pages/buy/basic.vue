<script setup>
import Container from '@components/buy/mContainer.vue'

import BackStep from '@pages/buy/_components/basic/BackStep.vue'
import TabCheck from '@pages/buy/_components/basic/TabCheck.vue'

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
    <template #tools>
      <BackStep :active="0" />
    </template>
    <TabCheck />
  </Container>
</template>

<style></style>
