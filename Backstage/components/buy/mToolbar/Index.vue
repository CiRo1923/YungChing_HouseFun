<script setup>
/* component-deps —— 複製這支元件時要一起帶走:
   stores/.composables/useCommonActions.js
   stores/common.js */
import './.css/variables.css'
import './.css/common.css'

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

/* 每一顆按鈕要做的事由使用端在 config.anchors 裡給,這裡只負責把它叫起來。
  沒給的話預設是 null,所以要用可選呼叫。 */
const onAnchorClick = (anchor) => anchor.onClick?.()
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
            main: '--text-center --border-gray-e5 --bg-white --oval --h-30 --px-15 --text-gray-666',
            text: 'm-toolbar-anchor-text',
            icon: 'm-toolbar-anchor-icon',
          }"
          @click="onAnchorClick(anchor)"
        />
      </li>
      <li class="m-toolbar-content">
        <slot />
      </li>
    </ul>
  </div>
</template>
