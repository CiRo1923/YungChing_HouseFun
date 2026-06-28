<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const isDeviceP = computed(() => device.value === 'p')

const props = defineProps({
  ids: {
    type: Array,
    default: () => [],
  },
})

const items = computed(() => {
  const defaultItems = [
    {
      id: 'gold',
      label: '黃金曝光',
      class: '--bg-red-e45c --text-white --text-shadow',
      isHidden: isDeviceP.value,
    },
    {
      id: 'new',
      label: 'NEW',
      class: '--bg-orange-f74c --text-white --text-shadow',
    },
  ]

  return defaultItems.filter((item) => props.ids.includes(item.id))
})

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <ul
    class="absolute flex items-center gap-x-[3px] tm:left-[12px] tm:top-[12px] p:left-[25px] p:top-[25px]"
  >
    <template v-for="(item, index) in items" :key="`${item.id}_${index}`">
      <li v-if="!item.isHidden">
        <BuyMTagDefault
          :label="item.label"
          :setClass="{
            main: ['--rounded-3 --px-6 --py-4', item.class],
            label: 'tm:text-[12px] p:text-[14px]',
          }"
        />
      </li>
    </template>
  </ul>
</template>
