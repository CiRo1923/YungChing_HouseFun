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

const steps = readonly([
  {
    icon: 'icon_phone',
    text: '手機驗證',
  },
  {
    icon: 'icon_lock',
    text: '重設密碼',
  },
  {
    icon: 'icon_check_circle',
    text: '設定完成',
  },
])
</script>

<template>
  <div class="space-y-[20px]" :class="setClass.main">
    <header :class="setClass.header">
      <component :is="config.as" class="text-center tm:text-[24px] p:text-[30px]">
        <strong class="font-medium">{{ props.title }}</strong>
      </component>
    </header>
    <MemberMStepOval
      :items="steps"
      :config="{
        step: config.step,
      }"
      :setClass="{
        label: 'tm:text-[14px] p:text-[16px]',
      }"
      :class="setClass.steps"
    />
  </div>
</template>
