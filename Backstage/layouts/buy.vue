<script setup>
const common = useCommonStore()
const buyProject = useBuyProjectStore()
const { isLoading } = storeToRefs(common)
</script>

<template>
  <div class="l-wrap flex grow flex-col">
    <header class="l-header shrink-0 bg-[--gray-666]">
      <h1 class="sr-only">{{ buyProject.NAME }}</h1>
      <BuyMHeader />
    </header>
    <main class="l-body grow">
      <slot />
    </main>
    <footer class="l-footer shrink-0">
      <BuyMFooter />
    </footer>
  </div>
  <CommonMLoadingMain
    :config="{
      isFixed: true,
    }"
    v-if="isLoading"
  />
  <div id="box">
    <BuyCommonAlertSystem />
    <BuyCommonConfirmSystem />
    <BuyCommonApiPromiseSystem />
  </div>
</template>

<style></style>
