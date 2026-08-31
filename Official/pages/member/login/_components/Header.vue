<script setup>
const props = defineProps({
  title: {
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

const config = computed(() => {
  return {
    as: 'h2',
    description: null,
    image: null,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    description: '',
    image: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="tm:space-y-[5px] p:space-y-[10px]" :class="setClass.main">
    <header :class="setClass.header">
      <component :is="config.as" class="tm:text-[24px] p:text-[30px]">
        <strong class="font-medium">{{ props.title }}</strong>
      </component>
      <div
        class="text-[16px] text-[--gray-666]"
        :class="setClass.description"
        v-if="config.description || $slots.description"
      >
        <slot name="description">
          <p v-html="config.description" />
        </slot>
      </div>
    </header>
  </div>
</template>
