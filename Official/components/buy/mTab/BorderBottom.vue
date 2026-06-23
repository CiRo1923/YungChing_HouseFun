<script setup>
import { onMergeTabConfig, useTabCore } from './.composables/useTabCore.js'

const emits = defineEmits(['click'])
const props = defineProps({
  items: {
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
    active: null,
    containerMode: 'multiple', // multiple / single / false
    schema: {
      id: 'id',
      label: 'label',
    },
  })
})

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    headerItems: '',
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

const onAnchorClick = (item, index) => {
  onClick(item, index)
  emits('click', { item, index })
}
</script>

<template>
  <div class="m-tab --border-bottom" :class="setClass.main">
    <div class="m-tab-header" :class="setClass.header">
      <ul class="m-tab-header-items flex" :class="setClass.headerItems">
        <li
          class="m-tab-header-item flex items-center"
          :class="setClass.headerItem"
          v-for="(item, index) in props.items"
          :key="`tab_header_${item[config.schema.id]}_${index}`"
        >
          <component
            :is="onHeaderAs(item)"
            class="m-tab-anchor relative flex w-full items-center justify-center gap-x-[4px] transition-colors duration-300"
            :class="[
              {
                '--active': index === activeIndex,
              },
              setClass.anchor,
            ]"
            v-bind="onHeaderBind(item)"
            @click="onAnchorClick(item, index)"
          >
            <CommonSvgIcon
              :icon="item.icon"
              class="m-tab-icon h-[22px] w-[22px] p-[2px] transition-colors duration-300"
              v-if="item.icon"
            />
            <slot name="anchor" :item="item" :index="index">
              <em class="m-tab-anchor-label">{{ item[config.schema.label] }}</em>
            </slot>
          </component>
        </li>
      </ul>
      <slot name="headerTools" />
    </div>
    <div class="m-tab-body relative z-0" :class="setClass.body">
      <div class="m-table-body-content overflow-hidden border-transparent">
        <!-- 單一區塊 -->
        <ul class="m-tab-body-items" v-if="config.containerMode === 'single'">
          <li class="m-tab-body-item">
            <slot />
          </li>
        </ul>
        <!-- 多個區塊 -->
        <ul
          class="m-tab-body-items flex w-[200%] will-change-transform"
          :class="[animating, direction]"
          @transitionend="onTrackTransitionEnd"
          v-if="config.containerMode === 'multiple'"
        >
          <template v-for="(item, index) in props.items" :key="`tab_body_${item.label}_${index}`">
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

<style src="@css/_modules/buy/mTab.css"></style>
<style lang="postcss">
:root {
  --tab-border-bottom-pc-border-h: 3px;
  --tab-border-bottom-tablet-border-h: 3px;
  --tab-border-bottom-mobile-border-h: 3px;

  --tab-border-bottom-anchor-color: var(--gray-666);
  --tab-border-bottom-anchor-active-color: transparent;
  --tab-border-bottom-body-border-color: var(--gray-e5);
}

.m-tab {
  &.\-\-border-bottom {
    --tab-border-bottom-border-h: 0;
    --tab-border-bottom-border-w: 0;

    &.\-\-green-8b0d {
      --tab-border-bottom-anchor-active-color: var(--green-8b0d);
    }

    .m-tab-anchor {
      &.\-\-active {
        @apply text-[--tab-border-bottom-anchor-active-color];

        &:after {
          --tab-border-bottom-border-w: 100%;
        }

        .m-tab-anchor-label {
          @apply font-medium;
        }
      }

      &:not(.\-\-active) {
        @apply text-[--tab-border-bottom-anchor-color];
      }

      &:after {
        @apply pointer-events-none absolute bottom-0 z-[1] h-[--tab-border-bottom-border-h] w-[--tab-border-bottom-border-w] bg-[--tab-border-bottom-anchor-active-color] transition-widths duration-300 content-default;
      }
    }

    .m-tab-body {
      border-top-width: var(--tab-border-bottom-border-h);

      @apply mt-[calc(var(--tab-border-bottom-border-h)_*_-1)] border-solid border-t-[--tab-border-bottom-body-border-color];
    }

    /* .m-tab-anchor {
      &:not(.\-\-active) {
        @apply text-[--gray-666];

        .m-tab-icon {
          @apply text-[--gray-999];
        }
      }
    } */
  }
}

@screen p {
  .m-tab {
    &.\-\-border-bottom {
      &.\-\-has-border-b,
      &.p\:\-\-has-border-b,
      &.pt\:\-\-has-border-b {
        --tab-border-bottom-border-h: var(--tab-border-bottom-pc-border-h);
      }
    }
  }
}

/* @screen pt {
  .m-tab {
    &.\-\-oval-responsiv {
      &.\-\-green-8b0d {
        .m-tab-body {
          @apply border-t-[--green-8b0d];
        }
      }

      .m-tab-header {
        @apply gap-x-[8px];
      }

      .m-tab-body {
        @apply mt-[-3px] border-t-[4px];
      }

      .m-tab-anchor {
        @apply rounded-t-[15px];

        &:not(.\-\-active) {
          @apply bg-[--gray-f7];
        }

        &.\-\-active {
          @apply shadow-black-y2-b4;
        }
      }
    }
  }
} */

@screen t {
  .m-tab {
    &.\-\-border-bottom {
      &.\-\-has-border-b,
      &.pt\:\-\-has-border-b,
      &.tm\:\-\-has-border-b,
      &.t\:\-\-has-border-b {
        --tab-border-bottom-border-h: var(--tab-border-bottom-tablet-border-h);
      }
    }
  }
}

@screen m {
  .m-tab {
    &.\-\-border-bottom {
      &.\-\-has-border-b,
      &.tm\:\-\-has-border-b,
      &.m\:\-\-has-border-b {
        --tab-border-bottom-border-h: var(--tab-border-bottom-mobile-border-h);
      }
    }
  }
}
</style>
