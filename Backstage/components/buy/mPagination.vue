<script setup>
const emits = defineEmits(['click'])
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

  return route.name ? resolveComponent('NuxtLink') : 'button'
})

const config = computed(() => {
  return {
    nowPage: 0, // 現在頁數
    itemsPage: 0, // 一頁的筆數
    pageNumber: 0, // 分頁器秀的頁數
    total: 0, // 總共幾筆
    queryKey: 'pg', // 取得 query 的 name
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

const onBind = (page) => {
  const { queryKey } = config.value
  const { route } = props
  const name = typeof as.value === 'object' ? as.value.name : as.value

  return name === 'NuxtLink'
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
const onClick = (page) => {
  emits('click', page)
}
</script>

<template>
  <div class="m-pagination text-center" :class="setClass.main">
    <ol class="inline-flex items-center gap-x-[--pagination-gap-x]">
      <li v-for="(page, index) in visiblePages" :key="`${page}_${index}`">
        <component
          :is="as"
          class="m-pagination-anchor"
          v-bind="onBind(page)"
          @click="onClick(page)"
          v-if="page !== config.nowPage"
        >
          {{ page }}
        </component>
        <button
          type="button"
          class="m-pagination-anchor --curr bg-[--pagination-curr-bg-color] text-[--pagination-curr-color]"
          @click="onClick(page)"
          v-else
        >
          {{ page }}
        </button>
      </li>
    </ol>
  </div>
</template>

<style lang="postcss">
:root {
  --pagination-gap-x: 5px;
  --pagination-width: 30px;
  --pagination-height: 30px;
  --pagination-text: 16px;
  --pagination-rounded: 3px;
  --pagination-curr-bg-color: transparent;
  --pagination-curr-color: var(--gray-666);
}

.m-pagination-anchor {
  font-size: var(--pagination-text);

  @apply flex h-[--pagination-height] w-[--pagination-width] items-center justify-center rounded-[--pagination-rounded] transition-colors duration-300;

  &.\-\-curr {
    --pagination-curr-bg-color: var(--green-8b0d);
    --pagination-curr-color: var(--white);
  }
}
</style>
