<script setup>
import Container from '@components/buy/mContainer.vue'

// import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/composables/useCommonActions.js'

// const common = useCommonStore()
const { onWithLoadingAll } = useCommonActions()

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
})

const route = useRoute()
const hfID = computed(() => route.params.id)

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
