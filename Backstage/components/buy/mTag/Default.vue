<script setup>
const props = defineProps({
  text: {
    type: String,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    icon: '',
    text: '',
    ...props.setClass,
  }
})
</script>

<template>
  <span class="m-tag --default justify-center" :class="setClass.main">
    <CommonSvgIcon
      icon="icon_check_solid"
      class="m-tag-icon h-[15px] w-[15px] text-[--orange-e646]"
      :class="setClass.icon"
    />
    <em :class="setClass.text" v-html="props.text" />
  </span>
</template>

<style src="@css/_modules/buy/mTag.css" />
<style lang="postcss">
.m-tag {
  &.\-\-default {
    &.--bg-orange-feea {
      @apply bg-[--orange-feea];
    }
  }
}
</style>
