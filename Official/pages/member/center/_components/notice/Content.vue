<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <ul>
    <li
      class="border-b-[1px] border-b-[--gray-e5] last:border-b-0 hover:bg-[--gray-f7]"
      v-for="item in props.items"
      :key="item.id"
    >
      <PageMemberCenterNoticeContentCard :item="item" />
    </li>
  </ul>
</template>
