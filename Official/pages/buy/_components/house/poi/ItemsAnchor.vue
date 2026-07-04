<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  activeID: {
    type: String,
    default: null,
  },
})

const activeData = computed(
  () => props.items.find((item) => item.id === props.activeID)?.data ?? []
)
</script>

<template>
  <ul class="pt:absolute pt:right-0 pt:top-0 p:w-[300px] p:px-[20px] p:py-[10px]">
    <li v-for="(item, index) in activeData" :key="`${item.name}_${index}`">
      <button type="button" class="flex items-center">
        {{ item.name }}
      </button>
    </li>
  </ul>
</template>

<style lang="postcss"></style>
