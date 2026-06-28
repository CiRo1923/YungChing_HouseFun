<script setup>
const buyHouse = useBuyHouseStore()
const { community } = storeToRefs(buyHouse)
</script>

<template>
  <header>
    <h3 class="tm:text-[18px] p:text-[24px]">
      <strong>{{ community.name }}</strong>
    </h3>
  </header>
</template>

<style lang="postcss"></style>
