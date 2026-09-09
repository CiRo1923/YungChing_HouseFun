<script setup>
import '@css/_modules/common/mNav/appVariables.css'
import '@css/_modules/common/mNav/app.css'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const items = readonly([
  {
    icon: 'icon_line',
    label: '好房網買屋小房 LINE',
  },
  {
    icon: 'icon_app',
    label: '好房網買屋 APP',
  },
])

const isDeviceM = computed(() => device.value === 'm')

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <ul class="m-nav-app" v-if="isDeviceM">
    <li v-for="(item, index) in items" :key="`${item.label}_${index}`">
      <CommonMAnchor
        :text="item.label"
        :config="{
          icon: {
            name: item.icon,
            position: 'left',
          },
        }"
        :setClass="{
          main: 'm-nav-app-anchor --px-20 --py-15',
          text: 'm-nav-app-text',
          icon: 'm-nav-app-icon',
        }"
      />
    </li>
  </ul>
</template>
