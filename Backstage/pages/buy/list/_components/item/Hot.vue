<script setup>
import { numberComma } from '@js/_prototype.js'

const emits = defineEmits(['click:view', 'click:comment'])
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
      as: 'p',
      icon: 'icon_check_solid',
      content: '優質排序',
      class: 'm:grow',
      isHide: !isHQSort,
    },
    {
      id: 'viewCount',
      as: 'button',
      icon: 'icon_two_people',
      content: numberComma.add(caseViewCount),
      class: 'm:shrink-0',
      onClick: () => emits('click:view', props.data),
    },
    {
      id: 'commentCount',
      as: 'button',
      icon: 'icon_dialogue',
      content: numberComma.add(caseCommentCount),
      class: 'm:shrink-0',
      onClick: () => emits('click:comment', props.data),
    },
  ]
})
</script>
<template>
  <ul
    class="flex items-center text-[14px] text-[--gray-666] m:justify-end tm:gap-x-[16px] pt:grow p:gap-x-[24px]"
  >
    <template v-for="(item, index) in items" :key="`${item.id}_${index}`">
      <li :class="item.class" v-if="!item.isHide">
        <BuyMAnchor
          :text="item.content"
          :config="{
            icon: {
              name: item.icon,
              position: 'left',
            },
          }"
          :setClass="{
            main: 'underline',
            icon: 'h-[16px] w-[16px]',
          }"
          @click="item.onClick"
          v-if="item.as === 'button'"
        />
        <div class="flex items-center gap-x-[4px]" v-else>
          <CommonSvgIcon :icon="item.icon" class="h-[16px] w-[16px]" />
          <p>{{ item.content }}</p>
        </div>
      </li>
    </template>
  </ul>
</template>

<style lang="postcss"></style>
