<script setup>
import Anchor from '@components/buy/mAnchor.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useBuyProjectStores from '@stores/buy/_composables/useProjectStores.js'

const project = useBuyProjectStore()
const { device } = storeToRefs(project)
const { onResize } = useBuyProjectStores()
const props = defineProps({
  anchor: {
    type: Object,
    default: null,
  },
})
const isDeviceP = computed(() => device.value === 'p')
const anchor = computed(() => {
  return {
    text: '返回',
    to: null,
    href: null,
    icon: {
      position: 'left',
      name: 'chevron_left',
    },
    onClick: null,
    ...props.anchor,
  }
})

onBeforeUnmount(() => {
  onResize('remove')
})

onMounted(() => {
  onResize('add')
})
</script>

<template>
  <div class="m-toolbar">
    <ul class="p:flex p:items-center p:gap-x-[16px]">
      <!-- device 預設值先給 p 平板、手機 先用 css 隱藏；畫面不會跳閃 -->
      <li class="tm:hidden p:shrink-0" v-if="isDeviceP">
        <Anchor
          :text="anchor.text"
          :to="anchor.to"
          :href="anchor.href"
          :config="{
            icon: anchor.icon,
          }"
          :setClass="{
            main: '--border-gray-e5 --bg-white --oval --h-30 --px-15 --text-gray-666',
            icon: 'text-[--gray-999] p:h-[16px] p:w-[16px]',
          }"
          @click="anchor.onClick"
        />
      </li>
      <li class="flex h-[30px] flex-col justify-center rounded-full bg-[--white] px-[20px] p:grow">
        <slot />
      </li>
    </ul>
  </div>
</template>

<style></style>
