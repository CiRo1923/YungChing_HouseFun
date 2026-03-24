<script setup>
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

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

const config = computed(() => {
  return {
    loop: false,
    autoplay: false,
    nav: false,
    pagination: false,
    autoWidth: false,
    slidesPerView: 1,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    container: '',
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
        :loop="config.loop && props.data.length > 1"
        :slidesPerView="config.autoWidth ? 'auto' : config.slidesPerView"
        :pagination="paginationConfig || false"
        @before-init="onBeforeInit"
        @slide-change="onChange"
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
            <SvgIcon :icon="navConfig.icon.prev" class="h-full w-full" />
          </button>
          <button type="button" class="m-swiper12-nav --next" :class="setClass.nav" @click="onNext">
            <SvgIcon :icon="navConfig.icon.next" class="h-full w-full" />
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
