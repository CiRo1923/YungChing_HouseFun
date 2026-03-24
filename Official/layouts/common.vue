<script setup>
import Header from '@components/common/mHeader.vue'
import Footer from '@components/common/mFooter.vue'
import Loading from '@components/common/mLoading.vue'

import { useCommonStore } from '@stores/common.js'

const route = useRoute()
const channel = computed(() => route.meta.title)
const common = useCommonStore()
const { isLoading } = storeToRefs(common)
</script>

<template>
  <div class="l-wrap">
    <header class="l-header relative z-[1] shadow-black-y2-b4">
      <h1 class="sr-only">{{ channel }}</h1>
      <Header />
    </header>
    <main class="l-body">
      <slot />
    </main>
    <footer class="l-footer">
      <Footer />
    </footer>
    <Loading v-if="isLoading" />
  </div>
</template>

<style></style>
