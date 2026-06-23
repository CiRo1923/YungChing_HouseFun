<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const addressInfo = computed(() => {
  return [
    {
      id: 'address',
      value: props.item.address,
      icon: 'icon_loaction',
    },
    {
      id: 'community',
      value: props.item.buildingName,
      icon: 'icon_community',
    },
  ]
})
</script>

<template>
  <ul class="m:space-y-[5px] t:gap-x-[10px] p:flex p:items-center p:gap-x-[15px]">
    <template v-for="(data, index) in addressInfo" :key="`${data.id}_${index}`">
      <li v-if="data.value">
        <p class="tracking-default flex items-center gap-x-[5px] text-[14px]">
          <CommonSvgIcon
            :icon="data.icon"
            class="h-[14px] w-[14px] shrink-0 p-[1px] text-[--gray-999]"
          />
          <em class="grow">{{ data.value }}</em>
        </p>
      </li>
    </template>
  </ul>
</template>

<style></style>
