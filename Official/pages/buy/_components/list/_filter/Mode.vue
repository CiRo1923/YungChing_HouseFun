<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

import { useProjectStore } from '@stores/buy/project.js'
import { useListStore } from '@stores/buy/list.js'

import useProjectStores from '@stores/buy/_composables/useProjectStores.js'
import useListStores from '@stores/buy/_composables/useListStores.js'

const project = useProjectStore()
const list = useListStore()
const { device } = storeToRefs(project)
const { mode } = storeToRefs(list)
const { onResize } = useProjectStores()
const { onModeClick } = useListStores()
const isDeviceM = computed(() => device.value === 'm')

const items = readonly([
  {
    id: 'list',
    icon: 'icon_list',
  },
  // {
  //   id: 'grid',
  //   icon: 'icon_grid',
  // },
])

onBeforeUnmount(() => {
  onResize('remove')
})

onMounted(() => {
  onResize('add')
})
</script>

<template>
  <ul class="mode flex items-center gap-x-[5px]" v-if="!isDeviceM">
    <li v-for="(item, index) in items" :key="`${item.id}_${index}`">
      <button
        type="button"
        class="mode-anchor block h-[24px] w-[24px] p-[3px] transition-colors duration-300"
        :class="{ '--active': item.id === mode }"
        @click="onModeClick(item.id)"
      >
        <SvgIcon :icon="item.icon" class="h-full w-full" />
      </button>
    </li>
  </ul>
</template>

<style lang="postcss">
.mode-anchor {
  &.\-\-active {
    @apply text-[--green-8b0d];
  }
}
</style>
