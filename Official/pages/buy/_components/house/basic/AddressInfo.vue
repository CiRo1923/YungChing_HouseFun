<script setup>
const buyHouse = useBuyHouseStore()
const { detail, basic } = storeToRefs(buyHouse)

const addressInfo = computed(() => {
  const { address } = basic.value
  const { community } = detail.value
  const { name } = community || {}

  return [
    {
      id: 'address',
      value: address,
      icon: 'icon_loaction',
    },
    {
      id: 'community',
      value: name,
      icon: 'icon_community',
    },
  ]
})
</script>

<template>
  <ul class="m:space-y-[5px] t:gap-x-[15px] pt:flex pt:items-center p:gap-x-[25px]">
    <template v-for="(data, index) in addressInfo" :key="`${data.id}_${index}`">
      <li v-if="data.value">
        <p class="tracking-default flex items-center gap-x-[3px] tm:text-[14px] p:text-[16px]">
          <CommonSvgIcon
            :icon="data.icon"
            class="h-[18px] w-[18px] shrink-0 p-[1px] text-[--gray-999]"
          />
          <em class="grow">{{ data.value }}</em>
        </p>
      </li>
    </template>
  </ul>
</template>

<style></style>
