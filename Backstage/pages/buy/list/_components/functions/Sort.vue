<script setup>
const items = shallowReadonly([
  {
    id: '',
    label: '刊登日',
  },
  {
    label: '到期日',
  },
  {
    label: '留言數',
  },
  {
    label: '瀏覽數',
  },
])
</script>

<template>
  <div>
    <span>排序</span>
    <!-- <ul>
      <li v-for="item, index in items" :key="``"></li>
    </ul> -->
  </div>
</template>

<style lang="postcss"></style>
