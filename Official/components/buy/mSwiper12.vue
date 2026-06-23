<script setup>
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const emits = defineEmits(['change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  data: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const swiperRef = ref(null)
const paginationRef = ref(null)

// 裝置對照：p=PC、t=平板、m=手機；pt=PC+平板、tm=平板+手機
const DEVICE_KEYS = ['p', 'pt', 'tm', 't', 'm']
const DEVICE_PRIORITY = {
  p: ['p', 'pt'],
  t: ['t', 'pt', 'tm'],
  m: ['m', 'tm'],
}

// 判斷是否為裝置設定物件（key 全為 p|pt|tm|t|m）
const isDeviceMap = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = Object.keys(value)
  return keys.length > 0 && keys.every((key) => DEVICE_KEYS.includes(key))
}

// 依當前 device 取回對應值，非裝置設定物件則原值回傳
const resolveByDevice = (value) => {
  if (!isDeviceMap(value)) return value

  const priority = DEVICE_PRIORITY[device.value] || []

  for (const key of priority) {
    if (key in value) return value[key]
  }

  return undefined
}

// Swiper 只認 px / %，這裡把 rem 字串換算成 px（rem × 根字級）
const normalizeSpace = (value) => {
  if (typeof value !== 'string' || !value.includes('rem')) return value

  const rootSize = import.meta.client
    ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    : 16

  return parseFloat(value) * rootSize
}

const config = computed(() => {
  const merged = {
    loop: false,
    autoplay: false,
    nav: false,
    pagination: false,
    autoWidth: false,
    slidesPerView: 1,
    spaceBetween: 0,
    ...props.config,
  }

  return {
    ...merged,
    loop: resolveByDevice(merged.loop),
    autoplay: resolveByDevice(merged.autoplay),
    nav: resolveByDevice(merged.nav),
    pagination: resolveByDevice(merged.pagination),
    autoWidth: resolveByDevice(merged.autoWidth),
    slidesPerView: resolveByDevice(merged.slidesPerView),
    spaceBetween: normalizeSpace(resolveByDevice(merged.spaceBetween)),
  }
})

const setClass = computed(() => {
  return {
    main: '',
    container: '',
    wrapper: '',
    item: '',
    navIcon: '',
    pagination: '',
    ...props.setClass,
  }
})

const navConfig = computed(() => {
  if (!config.value.nav) return false

  return {
    icon: {
      prev: 'chevron_left',
      next: 'chevron_right',
    },
    ...(typeof config.value.nav === 'object' ? config.value.nav : {}),
  }
})

const paginationConfig = computed(() => {
  if (!config.value.pagination) return false

  return {
    clickable: true,
    ...(typeof config.value.pagination === 'object' ? config.value.pagination : {}),
  }
})

const modules = computed(() => {
  const result = []

  if (config.value.autoplay) {
    result.push(Autoplay)
  }

  if (paginationConfig.value) {
    result.push(Pagination)
  }

  return result
})

const onBeforeInit = (swiper) => {
  swiperRef.value = swiper

  if (paginationConfig.value) {
    swiper.params.pagination.el = paginationRef.value
  }
}

const onPrev = () => {
  swiperRef.value?.slidePrev()
}

const onNext = () => {
  swiperRef.value?.slideNext()
}

const onChange = (swiper) => {
  emits('change', swiper)
}

const onInit = () => {
  const swiper = swiperRef.value

  if (!swiper) return

  if (paginationConfig.value && paginationRef.value) {
    swiper.params.pagination.el = paginationRef.value
    swiper.pagination.destroy()
    swiper.pagination.init()
    swiper.pagination.render()
    swiper.pagination.update()
  }
}

onResize()

onMounted(async () => {
  await nextTick()

  onInit()
})
</script>

<template>
  <div class="m-swiper12" :class="setClass.main">
    <ClientOnly>
      <Swiper
        class="m-swiper12-container relative h-full"
        :class="setClass.container"
        :modules="modules"
        :wrapperClass="`swiper-wrapper ${setClass.wrapper}`.trim()"
        :loop="config.loop && props.data.length > 1"
        :slidesPerView="config.autoWidth ? 'auto' : config.slidesPerView"
        :spaceBetween="config.spaceBetween"
        :pagination="paginationConfig || false"
        @beforeInit="onBeforeInit"
        @slideChange="onChange"
      >
        <SwiperSlide
          class="m-swiper12-item h-full"
          :class="setClass.item"
          v-for="(item, index) in data"
          :key="`${props.name}_${index}`"
        >
          <slot :item="item" :index="index">
            {{ item }}
          </slot>
        </SwiperSlide>
        <template v-if="navConfig && props.data.length > 1">
          <button type="button" class="m-swiper12-nav --prev" :class="setClass.nav" @click="onPrev">
            <CommonSvgIcon :icon="navConfig.icon.prev" class="h-full w-full" />
          </button>
          <button type="button" class="m-swiper12-nav --next" :class="setClass.nav" @click="onNext">
            <CommonSvgIcon :icon="navConfig.icon.next" class="h-full w-full" />
          </button>
        </template>
        <div
          class="m-swiper12-pagination"
          :class="setClass.pagination"
          v-if="paginationConfig && props.data.length > 1"
          ref="paginationRef"
        />
      </Swiper>
    </ClientOnly>
  </div>
</template>

<style lang="postcss">
.m-swiper12-nav {
  @apply absolute top-1/2 z-[1] -translate-y-1/2;

  &.\-\-prev {
    @apply left-0;
  }

  &.\-\-next {
    @apply right-0;
  }
}
</style>
