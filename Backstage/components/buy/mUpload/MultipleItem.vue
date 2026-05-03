<script setup>
const emit = defineEmits(['remove', 'check'])
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
  style: {
    type: [Object, Array, String],
    default: null,
  },
})

const config = computed(() => {
  return {
    isPreview: false,
    isDragging: false,
    ...props.config,
  }
})

const onCheckChange = (event) => {
  emit('check', event)
}

const onRemoveClick = () => {
  emit('remove')
}

const stopDragTrigger = (event) => {
  event.stopPropagation()
}
</script>

<template>
  <div
    class="relative"
    :class="{
      'opacity-30': config.isPreview,
    }"
    :style="style"
  >
    <div
      class="relative overflow-hidden rounded-[5px] m:h-[114px] p:h-[152px]"
      :class="{
        'pointer-events-none': config.isDragging,
      }"
    >
      <img :src="props.item.url" alt="" class="h-full w-full object-cover" draggable="false" />

      <button
        type="button"
        class="absolute right-0 top-0 z-[1] flex h-[24px] w-[24px] items-center justify-center rounded-[5px] bg-[--gray-f2]"
        :tabindex="config.isPreview ? -1 : undefined"
        @pointerdown.stop="stopDragTrigger"
        @click.stop="onRemoveClick"
      >
        <CommonSvgIcon icon="icon_xmark" class="h-[10px] w-[10px] text-[--gray-666]" />
      </button>
    </div>

    <label
      class="flex items-center justify-center m:absolute m:bottom-[5px] m:left-[5px] pt:mt-[6px]"
      @pointerdown.stop="stopDragTrigger"
      @click.stop="stopDragTrigger"
    >
      <input
        type="checkbox"
        class="m-upload-checkbox sr-only"
        :checked="props.item.checked"
        :tabindex="config.isPreview ? -1 : undefined"
        @pointerdown.stop="stopDragTrigger"
        @change="onCheckChange"
      />
      <CommonSvgIcon
        icon="icon_check_solid"
        class="m-upload-checkbox-icon relative mt-[2px] block h-[18px] w-[18px] shrink-0 self-start rounded-[2px] border-[1px] bg-[--white] p-[1px] text-[--orange-e646] transition-colors duration-300"
        :class="props.setClass.icon"
      />
    </label>
  </div>
</template>
