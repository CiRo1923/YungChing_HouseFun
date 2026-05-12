<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

const items = shallowReadonly([
  {
    id: 'address',
    value: props.data.address,
    component: 'address',
    icon: 'icon_location',
  },
  {
    id: 'community',
    value: props.data.community,
    component: 'p',
    icon: 'icon_community',
  },
])
</script>

<template>
  <ul
    class="m:space-y-[8px] pt:flex pt:grow pt:items-center pt:gap-x-[16px]"
    :class="setClass.main"
  >
    <template v-for="(item, idx) in items" :key="`${item.id}_${idx}`">
      <li class="flex items-center gap-x-[5px]" v-if="item.value">
        <CommonSvgIcon :icon="item.icon" class="h-[16px] w-[16px]" />
        <component :is="item.component">{{ item.value }}</component>
      </li>
    </template>
  </ul>
</template>

<style lang="postcss"></style>
