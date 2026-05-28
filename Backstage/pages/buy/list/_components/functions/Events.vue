<script setup>
const { selectCount } = useBuyListActions()

const emits = defineEmits([
  'click:renewal',
  'click:publish',
  'click:offline',
  'click:deal',
  'click:copy',
  'click:remove',
])
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
    id: 'offline',
    label: '下架',
  },
  {
    id: 'deal',
    label: '成交',
  },
  {
    id: 'copy',
    label: '複製資料',
  },
  {
    id: 'remove',
    label: '刪除',
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
