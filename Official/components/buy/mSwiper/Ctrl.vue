<script setup>
import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/.composables/useCommonActions.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const props = defineProps({
  name: {
    type: String,
    default: null,
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

const swiperGroup = inject('mSwiperGroup', null)
const swiperName = computed(() => props.name || swiperGroup?.name)
const swiperState = computed(() => swiperGroup?.state(swiperName.value))
const responsiveKeys = ['p', 'pt', 'tm', 't', 'm']

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

const hasResponsiveConfig = (value) => {
  return value && typeof value === 'object' && responsiveKeys.some((key) => key in value)
}

const resolveResponsiveConfig = (value) => {
  const resolvedValue = unref(value)

  if (!hasResponsiveConfig(resolvedValue)) return resolvedValue

  if ('p' in resolvedValue && device.value === 'p') return resolvedValue.p
  if ('t' in resolvedValue && device.value === 't') return resolvedValue.t
  if ('m' in resolvedValue && device.value === 'm') return resolvedValue.m
  if ('pt' in resolvedValue && ['p', 't'].includes(device.value)) return resolvedValue.pt
  if ('tm' in resolvedValue && ['t', 'm'].includes(device.value)) return resolvedValue.tm

  return false
}

const config = computed(() => {
  return {
    show: true, // 是否顯示控制按鈕 Boolean | {p: Boolean, pt: Boolean, tm: Boolean, t: Boolean, m: Boolean }
    icon: {
      prev: 'chevron_left',
      next: 'chevron_right',
    },
    ...Object.fromEntries(
      Object.entries(props.config).map(([key, value]) => [
        key,
        key === 'show' ? resolveResponsiveConfig(value) : value,
      ])
    ),
  }
})

const onPrev = () => {
  if (isPrevDisabled.value) return

  swiperGroup?.prev(swiperName.value)
}

const onNext = () => {
  if (isNextDisabled.value) return

  swiperGroup?.next(swiperName.value)
}

const isPrevDisabled = computed(() => {
  return Boolean(unref(swiperState.value?.isBeginning))
})

const isNextDisabled = computed(() => {
  return Boolean(unref(swiperState.value?.isEnd))
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
  <ClientOnly>
    <ul
      class="m-swiper-ctrl flex items-center gap-x-[--swiper-ctrl-gap-x]"
      :class="setClass.main"
      v-if="config.show"
    >
      <li class="">
        <button
          type="button"
          class="m-swiper-ctrl-anchor --prev"
          :class="{ disabled: isPrevDisabled }"
          :disabled="isPrevDisabled"
          @click="onPrev"
        >
          <SvgIcon class="m-swiper-ctrl-icon" :icon="config.icon.prev" />
        </button>
      </li>
      <li>
        <button
          type="button"
          class="m-swiper-ctrl-anchor --next"
          :class="{ disabled: isNextDisabled }"
          :disabled="isNextDisabled"
          @click="onNext"
        >
          <SvgIcon class="m-swiper-ctrl-icon" :icon="config.icon.next" />
        </button>
      </li>
    </ul>
  </ClientOnly>
</template>

<style lang="postcss"></style>
