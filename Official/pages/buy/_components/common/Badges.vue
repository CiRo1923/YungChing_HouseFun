<script setup>
const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const items = computed(() => {
  const defaultItems = [
    {
      id: 'vr',
      icon: 'icon_vr',
      content: '實境導覽',
    },
    {
      id: 'aiTour',
      icon: 'icon_ai_tour',
      content: 'AI 導覽',
    },
    {
      id: 'aiDecor',
      icon: 'icon_ai_decor',
      content: 'AI 煥裝',
    },
    {
      id: 'video',
      icon: 'icon_video',
      content: '影音',
    },
  ]

  return defaultItems
    .map((item) => {
      const match = props.data.find((dataItem) => dataItem.id === item.id)
      return match ? { ...item, ...match } : null
    })
    .filter(Boolean)
})

const hasItems = computed(() => items.value.some((item) => item.value))

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})
</script>

<template>
  <ul class="absolute z-[1] flex items-center gap-x-[4px]" :class="setClass.main" v-if="hasItems">
    <template v-for="(item, index) in items" :key="`${item.id}_${index}`">
      <li v-if="item.value">
        <BuyMTooltipMain
          :config="{
            icon: item.icon,
          }"
          :setClass="{
            main: '--h-24 --px-6 --bg-hexa-75-gray-333 --text-white',
            icon: 'h-[14px] w-[14px]',
            container: 'text-[12px]',
          }"
        >
          <template #content>{{ item.content }} {</template>
        </BuyMTooltipMain>
      </li>
    </template>
  </ul>
</template>

<style lang="postcss"></style>
