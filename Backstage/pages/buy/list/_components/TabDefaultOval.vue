<script setup>
import useBuyListActions from '@stores/buy/.composables/useListActions.js'

const { onReset } = useBuyListActions()
const items = shallowReadonly([
  {
    label: '刊登中',
    icon: 'icon_check_solid',
    to: {
      name: 'buy-list-publish',
      query: {
        pg: '1',
      },
    },
  },
  {
    label: '已下架',
    to: {
      name: 'buy-list-offline',
      query: {
        pg: '1',
      },
    },
  },
  {
    label: '草稿區',
    to: {
      name: 'buy-list-draft',
      query: {
        pg: '1',
      },
    },
  },
  {
    label: '已成交',
    to: {
      name: 'buy-list-deal',
      query: {
        pg: '1',
      },
    },
  },
])

const onClick = () => {
  onReset()
}
</script>

<template>
  <BuyMTabDefaultOval
    :items="items"
    :config="{
      containerMode: false,
    }"
    :setClass="{
      main: '--orange-e646 --anchor-height-40 p:--anchor-px-20 tm:--anchor-px-14',
      headerItem: 'm:flex-1',
    }"
    @click="onClick"
  />
</template>

<style lang="postcss"></style>
