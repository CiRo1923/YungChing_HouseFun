<script setup>
import Header from '@components/buy/mHeader.vue'
import Footer from '@components/buy/mFooter.vue'

import { useCommonStore } from '@stores/common.js'
import { useBuyProjectStore } from '@stores/buy/project.js'

const common = useCommonStore()
const buyProject = useBuyProjectStore()
const { isLoading } = storeToRefs(common)
</script>

<template>
  <div class="l-wrap">
    <header class="l-header bg-[--gray-666]">
      <h1 class="sr-only">{{ buyProject.NAME }}</h1>
      <Header />
    </header>
    <main class="l-body">
      <slot />
    </main>
    <footer class="l-footer">
      <Footer />
    </footer>
  </div>
  <CommonMLoading v-if="isLoading" />
</template>

<style></style>
