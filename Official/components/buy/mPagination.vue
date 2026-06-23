<script setup>
const props = defineProps({
  route: {
    type: Object,
    default: () => ({}),
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

const as = computed(() => {
  const { route } = props

  return route.name ? 'router-link' : 'button'
})

const config = computed(() => {
  return {
    nowPage: 0, // 現在頁數
    itemsPage: 0, // 一頁的筆數
    pageNumber: 5, // 分頁器秀的頁數
    total: 0, // 總共幾筆
    queryKey: 'pg', // 取得 query 的 name
    ...props.config,
  }
})

const totalPages = computed(() => {
  const { total, itemsPage } = config.value
  return Math.ceil(total / itemsPage)
})

const range = (start, end) =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) => start + index)

const visiblePages = computed(() => {
  const { nowPage, pageNumber } = config.value
  const totalPagesValue = totalPages.value

  if (totalPagesValue <= 0) return []

  // 總頁數比可顯示頁數少，直接全顯示
  if (totalPagesValue <= pageNumber) {
    return range(1, totalPagesValue)
  }

  // 頭尾固定顯示的頁數、現在頁兩側顯示的頁數
  const boundaryCount = 1
  const siblingCount = 1

  const startPages = range(1, Math.min(boundaryCount, totalPagesValue))
  const endPages = range(
    Math.max(totalPagesValue - boundaryCount + 1, boundaryCount + 1),
    totalPagesValue
  )

  // 現在頁兩側要顯示的範圍（夾在頭尾之間）
  const siblingsStart = Math.max(
    Math.min(nowPage - siblingCount, totalPagesValue - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2
  )
  const siblingsEnd = Math.min(
    Math.max(nowPage + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : totalPagesValue - 1
  )

  return [
    ...startPages,
    // 前段：有間隔顯示 ...，剛好差一頁則補上該頁
    ...(siblingsStart > boundaryCount + 2
      ? ['start-ellipsis']
      : boundaryCount + 1 < totalPagesValue - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    // 後段：有間隔顯示 ...，剛好差一頁則補上該頁
    ...(siblingsEnd < totalPagesValue - boundaryCount - 1
      ? ['end-ellipsis']
      : totalPagesValue - boundaryCount > boundaryCount
        ? [totalPagesValue - boundaryCount]
        : []),
    ...endPages,
  ]
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

const onBind = (page) => {
  const { queryKey } = config.value
  const { route } = props

  return as.value === 'router-link'
    ? {
        to: {
          name: route.name,
          params: route.params,
          query: {
            ...route.query,
            [queryKey]: page,
          },
        },
        ...(route.target
          ? {
              target: route.target,
              rel: 'noopener',
            }
          : {}),
      }
    : {
        type: 'button',
      }
}
</script>

<template>
  <div class="m-pagination text-center" :class="setClass.main" v-if="totalPages > 0">
    <div class="inline-flex items-center tm:gap-x-[5px] p:gap-x-[8px]">
      <component
        :is="config.nowPage <= 1 ? 'button' : as"
        class="m-pagination-arrow flex items-center justify-center transition-colors duration-300"
        :class="{ '--disabled': config.nowPage <= 1 }"
        v-bind="config.nowPage <= 1 ? { type: 'button', disabled: true } : onBind(1)"
        aria-label="第一頁"
      >
        <CommonSvgIcon icon="chevron_left" class="m-pagination-arrow-icon" />
      </component>
      <ol class="inline-flex items-center tm:gap-x-[5px] p:gap-x-[8px]">
        <li v-for="(page, index) in visiblePages" :key="`${page}_${index}`">
          <span
            v-if="page === 'start-ellipsis' || page === 'end-ellipsis'"
            class="m-pagination-ellipsis flex items-center justify-center text-[--gray-666]"
          >
            …
          </span>
          <span
            v-else-if="page === config.nowPage"
            class="m-pagination-anchor --curr flex items-center justify-center transition-colors duration-300"
          >
            {{ page }}
          </span>
          <component
            v-else
            :is="as"
            class="m-pagination-anchor flex items-center justify-center transition-colors duration-300"
            v-bind="onBind(page)"
          >
            {{ page }}
          </component>
        </li>
      </ol>
      <!-- 最後一頁 -->
      <component
        :is="config.nowPage >= totalPages ? 'button' : as"
        class="m-pagination-arrow flex items-center justify-center transition-colors duration-300"
        :class="{ '--disabled': config.nowPage >= totalPages }"
        v-bind="
          config.nowPage >= totalPages ? { type: 'button', disabled: true } : onBind(totalPages)
        "
        aria-label="最後一頁"
      >
        <CommonSvgIcon icon="chevron_right" class="m-pagination-arrow-icon" />
      </component>
    </div>
  </div>
</template>

<style lang="postcss">
.m-pagination-arrow,
.m-pagination-anchor,
.m-pagination-ellipsis {
  @apply h-[30px] w-[30px];
}

.m-pagination-arrow,
.m-pagination-anchor {
  @apply rounded-[3px];
}

.m-pagination-arrow {
  &:not(:disabled) {
    @apply text-[--gray-666];

    &:hover {
      @apply bg-[--gray-f7];
    }
  }

  &:disabled {
    @apply cursor-not-allowed text-[--gray-e5];
  }
}

.m-pagination-arrow-icon {
  @apply h-[20px] w-[20px] p-[2px];
}

.m-pagination-anchor {
  &:not(.\-\-disabled) {
    &:not(.\-\-curr) {
      &:not(:hover) {
        @apply bg-[--gray-f7] text-[--gray-666];
      }

      &:hover {
        @apply bg-[--green-8b0d] text-[--white];
      }
    }

    &.\-\-curr {
      @apply bg-[--gray-666] text-[--white];
    }
  }

  &.\-\-disabled {
    @apply cursor-not-allowed bg-transparent text-[--gray-ccce];
  }
}
</style>
