<script setup>
import './.css/variables.css'
import './.css/multipleVariables.css'
import './.css/common.css'
import './.css/multiple.css'

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
</script>

<template>
  <div
    class="m-upload-multiple-item"
    :class="[
      {
        '--preview': config.isPreview,
      },
    ]"
    :style="style"
  >
    <div
      class="m-upload-multiple-figure"
      :class="{
        '--dragging': config.isDragging,
      }"
    >
      <img :src="props.item.url" alt="" class="m-upload-multiple-image" draggable="false" />

      <button
        type="button"
        class="m-upload-multiple-remove"
        :tabindex="config.isPreview ? -1 : undefined"
        @pointerdown.stop
        @click.stop="onRemoveClick"
      >
        <CommonMSvgIcon icon="icon_xmark" class="m-upload-multiple-remove-icon" />
      </button>
    </div>

    <label class="m-upload-multiple-check" @pointerdown.stop @click.stop>
      <input
        type="checkbox"
        class="m-upload-checkbox"
        :checked="props.item.checked"
        :tabindex="config.isPreview ? -1 : undefined"
        @pointerdown.stop
        @change="onCheckChange"
      />
      <CommonMSvgIcon
        icon="icon_check_solid"
        class="m-upload-checkbox-icon m-upload-multiple-check-icon"
        :class="props.setClass.icon"
      />
    </label>
  </div>
</template>
