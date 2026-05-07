<script setup>
import { numberComma } from '@js/_prototype.js'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})

const items = computed(() => {
  const { isHQSort, caseViewCount, caseCommentCount } = props.data

  return [
    {
      id: 'sort',
      icon: 'icon_check_solid',
      content: '優質排序',
      isHide: !isHQSort,
    },
    {
      id: 'viewCount',
      icon: 'icon_two_people',
      content: numberComma.add(caseViewCount),
      onClick: () => {},
    },
    {
      id: 'commentCount',
      icon: 'icon_dialogue',
      content: numberComma.add(caseCommentCount),
      onClick: () => {},
    },
  ]
})
</script>
<template>
  <ul class="text-[14px] text-[--gray-666] pt:flex pt:grow pt:items-center p:gap-x-[24px]">
    <template v-for="(item, index) in items" :key="`${item.id}_${index}`">
      <li class="flex items-center gap-x-[4px]" v-if="!item.isHide">
        <CommonSvgIcon :icon="item.icon" class="h-[16px] w-[16px]" />
        <button type="button" class="underline" v-if="item.onClick">{{ item.content }}</button>
        <p v-else>{{ item.content }}</p>
      </li>
    </template>
  </ul>
</template>

<style lang="postcss"></style>
