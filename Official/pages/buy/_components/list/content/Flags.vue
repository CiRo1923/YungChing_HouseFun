<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const props = defineProps({
  ids: {
    type: Array,
    default: () => [],
  },
})

const isDeviceM = computed(() => device.value === 'm')

const items = computed(() => {
  const defaultItems = [
    {
      id: 'gold',
      label: '黃金曝光',
      class: '--bg-red-e45c --text-white --text-shadow',
      isHidden: !isDeviceM.value,
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
  <ul class="absolute left-[5px] top-[5px] z-[1] flex items-center gap-x-[3px]">
    <template v-for="(item, index) in items" :key="`${item.id}_${index}`">
      <li v-if="!item.isHidden">
        <BuyMTagDefault
          :label="item.label"
          :setClass="{
            main: ['--rounded-3 --px-6 --py-4', item.class],
            label: 'text-[12px]',
          }"
        />
      </li>
    </template>
  </ul>
</template>

<style lang="postcss"></style>
