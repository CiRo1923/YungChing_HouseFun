<script setup>
import Container from '@components/buy/mContainer.vue'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})

const route = useRoute()
const hfID = computed(() => route.params.id)
</script>

<template>
  <Container
    :setClass="{
      main: '--px-16',
    }"
  >
    <NuxtLink
      :to="{
        name: 'buy-basic-id',
        params: {
          id: hfID,
        },
      }"
    >
      basic
    </NuxtLink>
  </Container>
</template>

<style></style>
