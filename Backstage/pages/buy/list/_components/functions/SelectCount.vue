<script setup>
import useBuyListActions from '@stores/buy/composables/useListActions.js'

const { selectCount } = useBuyListActions()
</script>

<template>
  <p class="text-[--gray-666]">
    已選 <span class="text-[--orange-e646]">{{ selectCount }}</span> 筆
  </p>
</template>

<style lang="postcss"></style>
