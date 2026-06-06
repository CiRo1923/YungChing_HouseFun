<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const emits = defineEmits(['search'])
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

// 組件自身 config，與父系傳入的 props.config 合併
const config = computed(() => {
  return {
    defaultOpen: false,
    ...props.config,
    toggleText: {
      expand: '展開更多搜尋',
      collapse: '收合更多搜尋',
      ...props.config.toggleText,
    },
  }
})

const isDeviceM = computed(() => device.value === 'm')

// 展開狀態：預設由 config.defaultOpen 決定
const isExpand = ref(config.value.defaultOpen)

// 桌機永遠展開 list-accordion-hide；手機才由 isExpand 控制
const isShowHide = computed(() => !isDeviceM.value || isExpand.value)

const toggleText = computed(() =>
  isExpand.value ? config.value.toggleText.collapse : config.value.toggleText.expand,
)

const onToggle = () => {
  isExpand.value = !isExpand.value
}

const onSearchClick = () => {
  emits('search')
}

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="list-accordion m:space-y-[16px] pt:flex pt:items-center pt:gap-x-[8px]">
    <div
      class="list-accordion-container m:space-y-[16px] pt:flex pt:min-w-0 pt:grow pt:items-center pt:gap-x-[8px]"
    >
      <div class="list-accordion-default pt:flex pt:shrink-0 pt:items-center pt:gap-x-[8px]">
        <slot />
      </div>
      <Transition name="accordion">
        <div
          v-show="isShowHide"
          class="list-accordion-hide m:space-y-[16px] pt:flex pt:min-w-0 pt:grow pt:items-center pt:gap-x-[8px]"
        >
          <slot name="hide" />
        </div>
      </Transition>
    </div>
    <footer class="list-accordion-footer pt:shrink-0">
      <ul class="flex items-center justify-between">
        <li v-if="isDeviceM">
          <BuyMAnchor
            :text="toggleText"
            :setClass="{
              main: '--border-gray-e5 --bg-white --oval --h-30 --px-20 --text-gray-666',
            }"
            @click="onToggle"
          />
        </li>
        <li>
          <BuyMAnchor
            text="搜尋"
            :setClass="{
              main: '--bg-green-6a2d --oval --h-35 --px-20 --text-white',
            }"
            @click="onSearchClick"
          />
        </li>
      </ul>
    </footer>
  </div>
</template>

<style lang="postcss"></style>
