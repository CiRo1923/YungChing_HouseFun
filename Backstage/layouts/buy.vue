<script setup>
import AlertSystem from '@containers/buy/common/AlertSystem.vue'
// import ConfirmSystem from '@containers/buy/common/ConfirmSystem.vue'

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
      <BuyMHeader />
    </header>
    <main class="l-body">
      <slot />
    </main>
    <footer class="l-footer">
      <BuyMFooter />
    </footer>
  </div>
  <CommonMLoading v-if="isLoading" />
  <div id="box">
    <AlertSystem />
    <!-- <ConfirmSystem /> -->
    <!-- <ApiRunSystem /> -->
  </div>
</template>

<style></style>
