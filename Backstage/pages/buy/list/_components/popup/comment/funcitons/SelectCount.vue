<script setup>
const { commentsSelectCount } = useBuyListActions()
</script>

<template>
  <p class="text-[--gray-666] m:order-2 m:ml-auto">
    已選 <span class="text-[--orange-e646]">{{ commentsSelectCount }}</span> 筆
  </p>
</template>

<style lang="postcss"></style>
