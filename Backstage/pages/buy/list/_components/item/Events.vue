<script setup>
const emits = defineEmits(['click:publish', 'click:offline', 'click:deal', 'click:remove'])
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  items: {
    type: Array,
    default: () => [],
  },
})

const datas = shallowReadonly([
  {
    id: 'editor',
    icon: 'icon_pen',
    label: '修改',
    to: {
      name: 'buy-publish-basic-id',
      params: {
        id: props.data.hfID,
      },
    },
  },
  {
    id: 'publish',
    icon: 'icon_eye',
    label: '刊登',
    component: 'button',
    onClick: () => {
      // 有 props.data popup 不會出現已選擇 {0} 筆物件
      emits('click:publish', props.data)
    },
  },
  {
    id: 'offline',
    icon: 'icon_eye_hidden',
    label: '下架',
    component: 'button',
    onClick: () => {
      // 有 props.data popup 不會出現已選擇 {0} 筆物件
      emits('click:offline', props.data)
    },
  },
  {
    id: 'deal',
    icon: 'icon_house_done',
    label: '成交',
    component: 'button',
    onClick: () => {
      // 有 props.data popup 不會出現已選擇 {0} 筆物件
      emits('click:deal', props.data)
    },
  },
  {
    id: 'remove',
    icon: 'icon_xmark_circle',
    label: '刪除',
    component: 'button',
    onClick: () => {
      emits('click:remove', props.data)
    },
  },
])

const result = computed(() => datas.filter((item) => props.items.includes(item.id)))
</script>

<template>
  <ul
    class="flex items-center text-[14px] text-[--gray-666] m:order-4 m:mt-[24px] m:justify-between t:gap-x-[8px] p:gap-x-[16px]"
  >
    <li v-for="(item, index) in result" :key="`${item.id}_${index}`">
      <BuyMAnchor
        :text="item.label"
        :to="item.to"
        :config="{
          icon: {
            name: item.icon,
            position: 'left',
          },
        }"
        :setClass="{
          main: 'underline',
          icon: 'h-[16px] w-[16px]',
        }"
        @click="item.onClick"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
