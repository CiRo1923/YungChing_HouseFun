<script setup>
import { useSwiperCore } from '@components/buy/mSwiper/.composables/useSwiperCore.js'

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

const {
  wrapperRef,
  containerRef,
  displayData,
  getSlideAutoplayAttr,
  getSlotIndex,
  slideStyle,
  renderKey,
  navConfig,
  onClickCapture,
  onMouseEnter,
  onMouseLeave,
  onNext,
  onPaginationClick,
  onPointerStart,
  onPrev,
  onSlideTo,
  paginationConfig,
  paginationLength,
  realIndex,
  setClass,
  swiperName,
  containerStyle,
  isDragEnabled,
  isBeginning,
  isEnd,
} = useSwiperCore({
  props,
  emits,
})

defineExpose({
  onSlideTo,
})
</script>

<template>
  <div class="m-swiper" :class="setClass.main">
    <div
      class="m-swiper-wrapper --horizontal"
      :class="setClass.wrapper"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
      @pointerdown="onPointerStart"
      @click.capture="onClickCapture"
      @dragstart.prevent
      ref="wrapperRef"
    >
      <div
        ref="containerRef"
        class="m-swiper-container"
        :class="[setClass.container, isDragEnabled && '--draggable']"
        :style="containerStyle"
      >
        <div
          v-for="(item, index) in displayData"
          :key="`${swiperName || 'mSwiper'}_${renderKey}_${index}`"
          class="m-swiper-slide overflow-hidden"
          :class="setClass.slide"
          :style="slideStyle"
          :data-swiper-autoplay="getSlideAutoplayAttr(item)"
        >
          <slot :item="item" :index="getSlotIndex(index)">
            {{ item }}
          </slot>
        </div>
      </div>
      <slot name="content" />

      <div
        v-if="paginationConfig"
        class="m-swiper-pagination flex flex-wrap justify-center gap-x-[--swiper-pagination-gap-x]"
        :class="setClass.pagination"
      >
        <button
          v-for="(_, index) in paginationLength"
          :key="index"
          type="button"
          :class="[
            paginationConfig.bulletClass,
            realIndex === index && paginationConfig.bulletActiveClass,
          ]"
          @click="onPaginationClick(index)"
        />
      </div>
    </div>
    <template v-if="navConfig && props.data.length > 1">
      <button
        type="button"
        class="m-swiper-nav --prev"
        :class="[setClass.nav, setClass.navPrev, { '--disabled': isBeginning }]"
        :disabled="isBeginning"
        @click="onPrev"
      >
        <CommonSvgIcon :icon="navConfig.icon.prev" class="h-full w-full" />
      </button>

      <button
        type="button"
        class="m-swiper-nav --next"
        :class="[setClass.nav, setClass.navNext, { '--disabled': isEnd }]"
        :disabled="isEnd"
        @click="onNext"
      >
        <CommonSvgIcon :icon="navConfig.icon.next" class="h-full w-full" />
      </button>
    </template>
  </div>
</template>

<style src="@css/_modules/buy/mSwiper.css"></style>
