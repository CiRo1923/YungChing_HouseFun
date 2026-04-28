<script setup>
import AlertSystem from '@containers/common/AlertSystem.vue'
import ConfirmSystem from '@containers/common/ConfirmSystem.vue'
// import ApiRunSystem from '@containers/common/ApiRunSystem.vue'

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
      <CommonMHeader />
    </header>
    <main class="l-body relative z-0">
      <slot />
    </main>
    <footer class="l-footer">
      <CommonMFooter />
    </footer>
    <CommonMLoading v-if="isLoading" />
  </div>
  <div id="box">
    <AlertSystem />
    <ConfirmSystem />
    <!-- <ApiRunSystem /> -->
  </div>
</template>

<style></style>
