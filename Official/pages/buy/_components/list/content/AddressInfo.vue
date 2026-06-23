<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const isDeviceM = computed(() => device.value === 'm')
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const addressInfo = computed(() => {
  const { address, county, district, community } = props.item
  const { name } = community || {}
  return [
    {
      id: 'address',
      value: !isDeviceM.value ? address : `${county} ${district}`,
      icon: {
        name: 'icon_loaction',
        color: 'text-[--gray-999]',
      },
    },
    {
      id: 'community',
      value: name,
      icon: {
        name: 'icon_community',
        color: 'text-[--gray-666]',
      },
    },
  ]
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
  <!-- <pre>
    {{ props.item }}
  </pre> -->
  <ul class="flex items-center gap-x-[10px]">
    <template v-for="(data, idx) in addressInfo">
      <li class="flex items-center" v-if="data.value" :key="`${data.id}_${idx}`">
        <CommonSvgIcon
          :icon="data.icon.name"
          class="p-[1px] tm:h-[16px] tm:w-[16px] p:h-[18px] p:w-[18px]"
          :class="data.icon.color"
        />
        <em>{{ data.value }}</em>
      </li>
    </template>
  </ul>
</template>

<style lang="postcss"></style>
