<script setup>
import './.css/variables.css'
import './.css/clearButtonVariables.css'
import './.css/common.css'
import './.css/clearButton.css'

const emits = defineEmits(['click'])
const props = defineProps({
  label: {
    type: String,
    default: null,
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

// const config = computed(() => {
//   return {
//     ...props.config,
//   }
// })

const setClass = computed(() => {
  return {
    main: '',
    label: '',
    ...props.setClass,
  }
})

const onClick = () => {
  emits('click')
}
</script>

<template>
  <div class="m-tag --clear-button" :class="setClass.main">
    <div class="m-tag-label" :class="setClass.label" v-if="props.label || $slots.default">
      <slot>
        {{ props.label }}
      </slot>
    </div>
    <CommonMAnchor
      :config="{
        icon: 'icon_xmark_o',
      }"
      :setClass="{
        main: 'm-tag-xmark-button',
        icon: 'm-tag-xmark-button-icon',
      }"
      @click="onClick"
    />
  </div>
</template>
