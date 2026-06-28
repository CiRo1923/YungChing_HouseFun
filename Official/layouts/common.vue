<script setup>
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
    <CommonMLoadingMain
      :config="{
        isFixed: true,
      }"
      v-if="isLoading"
    />
  </div>
  <div id="box">
    <BuyCommonAlertSystem />
    <BuyCommonConfirmSystem />
    <BuyCommonApiPromiseSystem />
    <!-- <ApiRunSystem /> -->
  </div>
</template>

<style></style>
