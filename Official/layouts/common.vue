<script setup>
import Header from '@components/common/mHeader.vue'
import Footer from '@components/buy/mFooter.vue'

const route = useRoute()
const channel = computed(() => route.meta.title)
</script>

<template>
  <div class="l-wrap">
    <header class="l-header shadow-black-y2-b4">
      <h1 class="sr-only">{{ channel }}</h1>
      <Header />
    </header>
    <main class="l-body">
      <slot />
    </main>
    <footer class="l-footer">
      <Footer />
    </footer>
  </div>
</template>

<style></style>
