<script setup>
import '@css/_modules/buy/mStep/arrowVariables.css'
import '@css/_modules/buy/mStep/common.css'
import '@css/_modules/buy/mStep/arrow.css'

const props = defineProps({
  options: {
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
    active: 0,
    icon: null,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    item: '',
    icon: '',
    ...props.setClass,
  }
})
</script>

<template>
  <ul class="m-step --arrow" :class="setClass.main">
    <li
      class="m-step-item"
      :class="[
        {
          '--enabled': index < config.active,
          '--active': index === config.active,
        },
        setClass.item,
      ]"
      v-for="(item, index) in props.options"
      :key="`${item.label}_${index}`"
    >
      <CommonSvgIcon
        icon="chevron_right"
        class="m-step-icon --pending"
        v-if="index > config.active"
      />
      <CommonSvgIcon
        :icon="config.icon"
        class="m-step-icon"
        :class="setClass.icon"
        v-if="index <= config.active"
      />
      <slot :item="item" :index="index">
        <em>{{ item.label }}</em>
      </slot>
    </li>
  </ul>
</template>
