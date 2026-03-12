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
    pageNumber: 0, // 分頁器秀的頁數
    total: 0, // 總共幾筆
    ...props.config,
  }
})

const totalPages = computed(() => {
  const { total, itemsPage } = config.value
  return Math.ceil(total / itemsPage)
})

const visiblePages = computed(() => {
  const { nowPage, pageNumber } = config.value
  const totalPagesValue = totalPages.value

  if (totalPagesValue <= 0) return []

  // 總頁數比可顯示頁數少，直接全顯示
  if (totalPagesValue <= pageNumber) {
    return Array.from({ length: totalPagesValue }, (_, index) => index + 1)
  }

  const half = Math.floor(pageNumber / 2) + 1

  let start = nowPage - half + 1
  let end = start + pageNumber - 1

  // 靠前面時，從 1 開始
  if (start < 1) {
    start = 1
    end = pageNumber
  }

  // 靠後面時，貼齊最後一頁
  if (end > totalPagesValue) {
    end = totalPagesValue
    start = totalPagesValue - pageNumber + 1
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

const onBind = (index) => {
  const { route } = props
  const params = route.paramsKey
    ? {
        params: {
          [route.paramsKey]: index + 1,
        },
      }
    : {}
  const query = route.queryKey
    ? {
        query: {
          [route.queryKey]: index + 1,
        },
      }
    : {}

  return as.value === 'router-link'
    ? {
        to: {
          name: route.name,
          ...params,
          ...query,
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
  <div class="m-pagination text-center" :class="setClass.main">
    <ol class="inline-flex items-center p:gap-x-[8px]">
      <li v-for="(page, index) in visiblePages" :key="`${page}_${index}`">
        <component
          :is="as"
          class="m-pagination-anchor flex items-center justify-center rounded-[3px] transition-colors duration-300 p:h-[28px] p:w-[28px]"
          :class="{
            '--active': page === config.nowPage,
          }"
          v-bind="onBind(index)"
        >
          {{ page }}
        </component>
      </li>
    </ol>
  </div>
</template>

<style lang="postcss">
.m-pagination-anchor {
  &:not(.\-\-active) {
    @apply text-[--gray-666];
  }

  &.\-\-active {
    @apply bg-[--green-8b0d] text-[--white];
  }
}
</style>
