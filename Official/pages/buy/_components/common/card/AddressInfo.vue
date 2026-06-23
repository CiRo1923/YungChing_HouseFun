<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const items = computed(() => {
  const {
    // county,
    district,
    community,
  } = props.item

  return [
    {
      id: 'address',
      // label: `${county}${district}`,
      label: district,
      icon: 'icon_loaction',
    },
    {
      id: 'community',
      label: community?.name,
      icon: 'icon_community',
    },
  ]
})
</script>

<template>
  <ul class="flex items-center gap-x-[10px]">
    <template v-for="(data, index) in items" :key="`${data.id}_${index}`">
      <li v-if="data.label">
        <p class="tracking-default flex items-center gap-x-[5px] text-[14px]">
          <CommonSvgIcon
            :icon="data.icon"
            class="h-[14px] w-[14px] shrink-0 p-[1px] text-[--gray-999]"
          />
          <em class="grow">{{ data.label }}</em>
        </p>
      </li>
    </template>
  </ul>
</template>

<style></style>
