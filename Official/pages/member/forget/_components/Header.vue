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
    step: 1,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    steps: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="space-y-[20px]" :class="setClass.main">
    <header :class="setClass.header">
      <component :is="config.as" class="text-center tm:text-[24px] p:text-[30px]">
        <strong class="font-medium">{{ props.title }}</strong>
      </component>
    </header>
    <PageMemberForgetSteps :step="config.step" :class="setClass.steps" />
  </div>
</template>
