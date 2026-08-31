<script setup>
const emits = defineEmits(['update:anchorIndex', 'focusPlace'])
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  activeID: {
    type: String,
    default: null,
  },
  anchorIndex: {
    type: Number,
    default: null,
  },
})

const activeData = computed(
  () => props.items.find((item) => item.id === props.activeID)?.data ?? []
)

const onClick = (index) => {
  emits('update:anchorIndex', index)
  emits('focusPlace', index)
}
</script>

<template>
  <ul class="m:mt-[10px] pt:absolute pt:right-0 pt:top-0 p:w-[400px] p:px-[20px] p:py-[10px]">
    <li v-for="(item, index) in activeData" :key="`${item.name}_${index}`">
      <button
        type="button"
        class="group flex w-full items-center gap-x-[5px] rounded-[3px] px-[10px] py-[5px] text-left text-[--gray-333] p:min-h-[35px] p:text-[16px] [&.--active]:bg-[--green-ffe9]"
        :class="{ '--active': props.anchorIndex === index }"
        @click="onClick(index)"
      >
        <small
          class="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[--green-8b0d] text-[12px] text-[--white] transition-colors duration-300 group-[.--active]:bg-[--gray-2338]"
        >
          {{ index + 1 }}
        </small>
        <p class="grow">{{ item.name }}</p>
        <span class="flex shrink-0 items-center justify-center gap-x-[5px]">
          <CommonSvgIcon icon="icon_walk" class="h-[16px] w-[16px] p-[1px] text-[--gray-999]" />
          <small>{{ item.distanceMeter }} 公尺</small>
        </span>
      </button>
    </li>
  </ul>
</template>
