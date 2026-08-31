<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const items = computed(() => {
  const {
    // county,
    district,
    community,
  } = props.item

  return [
    {
      id: 'address',
      // label: `${county}${district}`,
      label: district,
      icon: 'icon_loaction',
    },
    {
      id: 'community',
      label: community?.name,
      icon: 'icon_community',
      to: {
        name: 'HomeIndex',
      },
    },
  ]
})
</script>

<template>
  <ul class="flex items-center gap-x-[10px]">
    <template v-for="(data, index) in items" :key="`${data.id}_${index}`">
      <li v-if="data.label">
        <p class="flex items-center gap-x-[5px] tracking-wider" v-if="!data.to">
          <CommonSvgIcon
            :icon="data.icon"
            class="h-[14px] w-[14px] shrink-0 p-[1px] text-[--gray-999]"
          />
          <em class="grow text-[14px]">{{ data.label }}</em>
        </p>
        <CommonMAnchor
          :text="data.label"
          :to="data.to"
          :config="{
            icon: {
              name: data.icon,
              position: 'left',
            },
          }"
          :setClass="{
            main: 'card-community-anchor hover:--text-green-6a2d relative z-[1] gap-x-[5px] tracking-wider underline',
            text: 'text-[14px]',
            icon: 'h-[14px] w-[14px] text-[--gray-999]',
          }"
          v-if="data.to"
        />
      </li>
    </template>
  </ul>
</template>
