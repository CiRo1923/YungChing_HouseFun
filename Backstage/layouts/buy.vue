<script setup>
import Header from '@components/buy/mHeader.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const project = useBuyProjectStore()
</script>

<template>
  <div class="l-wrap">
    <header class="l-header bg-[--gray-666]">
      <h1 class="sr-only">{{ project.NAME }}</h1>
      <Header />
    </header>
    <main class="l-body">
      <slot />
    </main>
  </div>
</template>

<style></style>
