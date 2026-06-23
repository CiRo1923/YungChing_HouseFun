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
  <div class="m-tab --oval-responsiv" :class="setClass.main">
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
            class="m-tab-anchor flex w-full items-center justify-center gap-x-[4px] transition-colors duration-300"
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
            />
            <slot name="anchor" :item="item" :index="index">
              <b class="font-semibold">{{ item[config.schema.label] }}</b>
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
  --tab-oval-responsiv-pc-border-h: 4px;
  --tab-oval-responsiv-tablet-border-h: 4px;
  /* --tab-oval-responsiv-mobile-border-h: 4px; */

  --tab-oval-responsiv-header-items-pc-gap-x: 8px;
  --tab-oval-responsiv-header-items-tablet-gap-x: 8px;
  /* --tab-oval-responsiv-header-items-mobile-gap-x: 8px; */

  --tab-oval-responsiv-anchor-pc-rounded-t: 15px;
  --tab-oval-responsiv-anchor-tablet-rounded-t: 15px;
  /* --tab-oval-responsiv-anchor-mobile-rounded-t: 15px; */

  --tab-oval-responsiv-header-color: transparent; /* 給 mobile 使用 */

  --tab-oval-responsiv-anchor-color: transparent;
  --tab-oval-responsiv-anchor-icon-color: transparent;
  --tab-oval-responsiv-anchor-bg-color: transparent;
  --tab-oval-responsiv-body-border-color: transparent;
}

.m-tab {
  &.\-\-oval-responsiv {
    &.\-\-green-8b0d {
      --tab-oval-responsiv-anchor-color: var(--gray-666);
      --tab-oval-responsiv-anchor-icon-color: var(--gray-999);
      --tab-oval-responsiv-anchor-bg-color: var(--gray-f7);

      .m-tab-anchor {
        &.\-\-active {
          --tab-oval-responsiv-anchor-color: var(--white);
          --tab-oval-responsiv-anchor-icon-color: var(--white);
          --tab-oval-responsiv-anchor-bg-color: var(--green-8b0d);
        }

        @apply bg-[--tab-oval-responsiv-anchor-bg-color] text-[--tab-oval-responsiv-anchor-color];
      }
    }
  }
}

@screen pt {
  .m-tab {
    &.\-\-oval-responsiv {
      &.\-\-green-8b0d {
        --tab-oval-responsiv-body-border-color: var(--green-8b0d);
      }

      .m-tab-header-items {
        @apply gap-x-[--tab-oval-responsiv-header-items-gap-x];
      }

      .m-tab-anchor {
        @apply rounded-t-[--tab-oval-responsiv-anchor-rounded-t];

        &.\-\-active {
          @apply shadow-black-y2-b4;
        }
      }

      .m-tab-icon {
        @apply text-[--tab-oval-responsiv-anchor-icon-color];
      }

      .m-tab-body {
        border-top-width: var(--tab-oval-responsiv-border-h);

        @apply mt-[calc(calc(var(--tab-oval-responsiv-border-h)_-_1px)_*_-1)] border-t-[--tab-oval-responsiv-body-border-color];
      }
    }
  }
}

@screen p {
  .m-tab {
    &.\-\-oval-responsiv {
      --tab-oval-responsiv-anchor-rounded-t: var(--tab-oval-responsiv-anchor-pc-rounded-t);
      --tab-oval-responsiv-border-h: var(--tab-oval-responsiv-pc-border-h);
      --tab-oval-responsiv-header-items-gap-x: var(--tab-oval-responsiv-header-items-pc-gap-x);
    }
  }
}

@screen t {
  .m-tab {
    &.\-\-oval-responsiv {
      --tab-oval-responsiv-anchor-rounded-t: var(--tab-oval-responsiv-anchor-tablet-rounded-t);
      --tab-oval-responsiv-border-h: var(--tab-oval-responsiv-tablet-border-h);
      --tab-oval-responsiv-header-items-gap-x: var(--tab-oval-responsiv-header-items-tablet-gap-x);
    }
  }
}

@screen m {
  .m-tab {
    &.\-\-oval-responsiv {
      &.\-\-green-8b0d {
        --tab-oval-responsiv-header-color: var(--gray-f7);
      }

      .m-tab-header {
        @apply bg-[--tab-oval-responsiv-header-color];
      }

      .m-tab-header-item {
        &:not(:first-child) {
          .m-tab-anchor {
            @apply rounded-l-full;
          }
        }

        &:not(:last-child) {
          .m-tab-anchor {
            @apply rounded-r-full;
          }
        }
      }
    }
  }
}
</style>
