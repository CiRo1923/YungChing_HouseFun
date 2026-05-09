<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})

const items = shallowReadonly([
  {
    id: 'caseAddr',
    component: 'address',
    icon: 'icon_location',
  },
  {
    id: 'buName',
    component: 'p',
    icon: 'icon_community',
  },
])
</script>

<template>
  <ul class="text-[--gray-666] pt:order-1 pt:flex pt:grow pt:items-center p:gap-x-[16px]">
    <template v-for="(item, idx) in items" :key="`${item.id}_${idx}`">
      <li class="flex items-center p:gap-x-[5px]" v-if="props.data[item.id]">
        <CommonSvgIcon :icon="item.icon" class="h-[16px] w-[16px]" />
        <component :is="item.component">{{ props.data[item.id] }}</component>
      </li>
    </template>
  </ul>
</template>

<style lang="postcss"></style>
