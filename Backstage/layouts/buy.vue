<script setup>
const common = useCommonStore()
const { isLoading } = storeToRefs(common)
const buyProject = useBuyProjectStore()
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
  <CommonMLoading
    :config="{
      isFixed: true,
    }"
    v-if="isLoading"
  />
  <div id="box">
    <CommonAlertSystem />
    <CommonConfirmSystem />
    <CommonApiPromiseSystem />
  </div>
</template>
