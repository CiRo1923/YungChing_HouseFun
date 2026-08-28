<script setup>
import '@css/_modules/common/mSeparator/variables.css'
import '@css/_modules/common/mSeparator/common.css'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
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

const config = computed(() => {
  return {
    isHiddenItem: true,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    item: '',
    ...props.setClass,
  }
})
</script>

<template>
  <ul class="m-separator" :class="setClass.main">
    <template v-for="(item, index) in items">
      <li
        class="m-separator-item"
        :class="setClass.item"
        :key="`${item.id}_${index}`"
        v-if="item.isHidden !== true || !config.isHiddenItem"
      >
        <slot :name="item.id" :item="item" :value="item.value">
          <span v-html="item.value" />
        </slot>
      </li>
    </template>
  </ul>
</template>
