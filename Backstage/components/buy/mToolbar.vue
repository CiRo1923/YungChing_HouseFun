<script setup>
import '@css/_modules/buy/mToolbar/variables.css'
import '@css/_modules/buy/mToolbar/common.css'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
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

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="m-toolbar">
    <ul class="m-toolbar-container">
      <li class="m-toolbar-back" v-if="isDeviceP">
        <BuyMAnchor
          :text="anchor.text"
          :to="anchor.to"
          :href="anchor.href"
          :config="{
            icon: anchor.icon,
          }"
          :setClass="{
            main: '--border-gray-e5 --bg-white --oval --h-30 --px-15 --text-gray-666',
            text: 'm-toolbar-anchor-text',
            icon: 'm-toolbar-anchor-icon',
          }"
          @click="anchor.onClick"
        />
      </li>
      <li class="m-toolbar-content">
        <slot />
      </li>
    </ul>
  </div>
</template>
