<script setup>
import useBuyListActions from '@stores/buy/composables/useListActions.js'

const { selectCount } = useBuyListActions()

const emits = defineEmits(['click:renewal', 'click:publish', 'click:removed', 'click:done'])
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
const datas = readonly([
  {
    id: 'renewal',
    label: '續刊',
  },
  {
    id: 'publish',
    label: '刊登',
  },
  {
    id: 'removed',
    label: '下架',
  },
  {
    id: 'done',
    label: '成交',
  },
])
const result = computed(() => datas.filter((item) => props.items.includes(item.id)))

const onClick = (id) => {
  emits(`click:${id}`)
}
</script>

<template>
  <ul class="flex items-center p:gap-x-[8px]">
    <li v-for="(item, index) in result" :key="`${item.id}_${index}`">
      <BuyMAnchor
        :text="item.label"
        :config="{
          isDisabled: selectCount === 0,
        }"
        :setClass="{
          main: '--border-gray-e5 --bg-white --oval --h-30 --px-15 --text-gray-666',
          text: 'text-[14px]',
        }"
        @click="onClick(item.id)"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
