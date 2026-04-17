<script setup>
import { useBuyHouseStore } from '@stores/buy/house.js'
import useBuyProjectActions from '@stores/buy/_composables/useProjectActions.js'

const buyHouse = useBuyHouseStore()
const { breadcrumb } = storeToRefs(buyHouse)
const { onSearchParams } = useBuyProjectActions()

const onAs = (item) => {
  const { url } = item

  if (url) return 'router-link'

  return 'em'
}

const onBind = (item) => {
  const { url } = item
  const params = onSearchParams(url)
  const isBuyChannel = /^\/buy\/list/.test(url)
  const query = params
    ? {
        ...params,
        ...(isBuyChannel ? { pg: 1 } : {}),
      }
    : isBuyChannel
      ? { pg: 1 }
      : {}

  return url
    ? {
        to: {
          path: url,
          query,
        },
      }
    : {}
}
</script>

<template>
  <ol class="breadcrumbs flex items-center">
    <li
      class="breadcrumbs-item flex items-center text-[14px]"
      v-for="(item, index) in breadcrumb"
      :key="`${item.text}_${index}`"
    >
      <component :is="onAs(item)" v-bind="onBind(item)">
        {{ item.text }}
      </component>
    </li>
  </ol>
</template>

<style lang="postcss">
.breadcrumbs-item {
  &:not(:first-child) {
    &::before {
      background-image: url(@imgs/common/breadcrumbs_arrow.svg);

      @apply mx-[10px] h-[10px] w-[6px] bg-cover bg-center bg-no-repeat content-default;
    }
  }
}
</style>
