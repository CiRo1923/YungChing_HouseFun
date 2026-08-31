<script setup>
import '@css/_modules/buy/mTag/variables.css'
import '@css/_modules/buy/mTag/clearButtonVariables.css'
import '@css/_modules/buy/mTag/common.css'
import '@css/_modules/buy/mTag/clearButton.css'

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
        icon: 'h-[14px] w-[14px]',
      }"
      @click="onClick"
    />
  </div>
</template>
