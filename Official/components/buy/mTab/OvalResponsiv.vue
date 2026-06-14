<script setup>
import { onMergeTabConfig, useTabCore } from './.composables/useTabCore.js'

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
</script>

<template>
  <div class="m-tab --oval-responsiv" :class="setClass.main">
    <ul class="m-tab-header flex" :class="setClass.header">
      <li
        class="m-tab-header-item flex items-center"
        :class="setClass.headerItem"
        v-for="(item, index) in props.items"
        :key="`tab_header_${item[config.schema.id]}_${index}`"
      >
        <component
          :is="onHeaderAs(item)"
          class="m-tab-anchor flex w-full items-center justify-center gap-x-[4px] px-[10px] py-[8px] text-[16px] transition-colors duration-300"
          :class="[
            {
              '--active': index === activeIndex,
            },
            setClass.anchor,
          ]"
          v-bind="onHeaderBind(item)"
          @click="onClick(item, index)"
        >
          <CommonSvgIcon
            :icon="item.icon"
            class="m-tab-icon h-[22px] w-[22px] p-[2px] transition-colors duration-300"
          />
          <slot name="header" :item="item" :index="index">
            <b class="font-semibold">{{ item[config.schema.label] }}</b>
          </slot>
        </component>
      </li>
    </ul>
    <div class="m-tab-body relative z-[1]" :class="setClass.body">
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
.m-tab {
  &.\-\-oval-responsiv {
    &.\-\-green-8b0d {
      .m-tab-anchor {
        &.\-\-active {
          @apply bg-[--green-8b0d] text-[--white];
        }
      }
    }

    .m-tab-anchor {
      &:not(.\-\-active) {
        @apply text-[--gray-666];

        .m-tab-icon {
          @apply text-[--gray-999];
        }
      }
    }
  }
}

@screen pt {
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
}

@screen m {
  .m-tab {
    &.\-\-oval-responsiv {
      .m-tab-header {
        @apply bg-[--gray-f7];
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
