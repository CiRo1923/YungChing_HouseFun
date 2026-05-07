<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})

const items = shallowReadonly([
  {
    id: 'editor',
    icon: 'icon_pen',
    label: '修改',
    to: {
      name: 'buy-basic-id',
      params: {
        id: props.data.hfID,
      },
    },
  },
  {
    id: 'removed',
    icon: 'icon_eye_hidden',
    label: '下架',
    onClick: () => {},
  },
  {
    id: 'done',
    icon: 'icon_house_done',
    label: '成交',
    onClick: () => {},
  },
])
</script>

<template>
  <ul class="flex items-center text-[14px] text-[--gray-666] p:gap-x-[16px]">
    <li v-for="(item, index) in items" :key="`${item.id}_${index}`">
      <NuxtLink :to="item.to" class="flex items-center gap-x-[4px]" v-if="item.to">
        <CommonSvgIcon :icon="item.icon" class="h-[16px] w-[16px]" v-if="item.icon" />
        <em>{{ item.label }}</em>
      </NuxtLink>
      <button type="button" class="flex items-center gap-x-[4px]" v-else>
        <CommonSvgIcon :icon="item.icon" class="h-[16px] w-[16px]" v-if="item.icon" />
        <em>{{ item.label }}</em>
      </button>
    </li>
  </ul>
</template>

<style lang="postcss"></style>
