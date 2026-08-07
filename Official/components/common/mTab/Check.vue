<script setup>
import '@css/_modules/common/mTab/variables.css'
import '@css/_modules/common/mTab/common.css'

import { onMergeTabConfig, useTabCore } from './.composables/useTabCore.js'

const emits = defineEmits(['changed'])
const props = defineProps({
  options: {
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

const config = computed(() => {
  return onMergeTabConfig(props.config, {
    active: 0,
  })
})

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    headerItem: '',
    anchor: '',
    body: '',
    ...props.setClass,
  }
})

const {
  activeIndex,
  prevIndex,
  direction,
  animating,
  isShowItem,
  onHeaderAs,
  onHeaderBind,
  onClick,
  onTrackTransitionEnd,
} = useTabCore({ config })

const onTransitionEnd = async (e) => {
  const changed = await onTrackTransitionEnd(e)
  if (!changed) return

  emits('changed', {
    item: props.options[activeIndex.value],
    index: activeIndex.value,
  })
}
</script>

<template>
  <div class="m-tab --check" :class="setClass.main">
    <ul class="m-tab-header flex gap-x-[8px]" :class="setClass.header">
      <li
        class="m-tab-header-item"
        :class="[{ '--active': index === activeIndex }, setClass.headerItem]"
        v-for="(item, index) in props.options"
        :key="`tab_header_${item.label}_${index}`"
      >
        <component
          :is="onHeaderAs(item)"
          class="m-tab-anchor rounded-t-[15px] px-[9px] py-[8px] text-[16px]"
          :class="setClass.anchor"
          v-bind="onHeaderBind(item)"
          @click="onClick(item, index)"
        >
          <CommonSvgIcon
            icon="icon_check_solid"
            class="m-tab-icon h-[16px] w-[16px]"
            v-if="index === activeIndex"
          />
          <slot name="header" :item="item" :index="index">
            <em class="m-tab-anchor-label font-semibold">{{ item.label }}</em>
          </slot>
        </component>
      </li>
    </ul>
    <div class="m-tab-body border-t-[4px] border-t-[--orange-e646]" :class="setClass.body">
      <div
        class="m-table-body-content overflow-hidden rounded-b-[15px] border-transparent bg-[--white]"
      >
        <ul
          class="m-tab-body-items flex w-[200%] will-change-transform"
          :class="[animating, direction]"
          @transitionend="onTransitionEnd"
        >
          <template v-for="(item, index) in props.options" :key="`tab_body_${item.label}_${index}`">
            <li
              class="m-tab-body-item w-1/2 shrink-0"
              v-if="!item.href && (index === activeIndex || (isShowItem && index === prevIndex))"
            >
              <slot :name="`content_${index}`" :index="index" />
            </li>
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.m-tab {
  &.\-\-check {
    .m-tab-header-item {
      &:not(.\-\-active) {
        .m-tab-anchor {
          @apply bg-[--white] text-[--gray-666];
        }
      }

      &.\-\-active {
        .m-tab-anchor {
          @apply bg-[--orange-e646] text-[--white];
        }
      }
    }

    .m-tab-body-items {
      &.\-\-animating {
        @apply transition-transform duration-300;

        &.\-\-left {
          @apply -translate-x-1/2;
        }

        &.\-\-right {
          @apply translate-x-0;
        }
      }

      &.\-\-right {
        @apply -translate-x-1/2;
      }
    }
  }
}
</style>
