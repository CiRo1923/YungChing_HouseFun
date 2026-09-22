<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const house = computed(() => props.item.house || {})
</script>

<template>
  <router-link
    class="line-clamp-1 text-[16px] font-medium"
    :to="{
      name: 'buy-house-hfid',
      params: {
        hfid: house.id,
      },
    }"
  >
    {{ house.title }}
  </router-link>
</template>
