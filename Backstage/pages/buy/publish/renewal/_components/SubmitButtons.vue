<script setup>
const route = useRoute()
const emits = defineEmits(['click:draft', 'click:save'])

const items = shallowReadonly([
  {
    label: '上一步',
    to: {
      name: 'buy-publish-basic-id',
      params: route.params,
    },
    class: {
      main: '--border-gray-e5 --bg-white --text-gray-666',
    },
  },
  {
    label: '儲存暫不上架',
    class: {
      main: '--border-gray-e5 --bg-white --text-gray-666',
    },
    onClick: () => {
      emits('click:draft')
    },
  },
  {
    label: '確定刊登上架',
    class: {
      main: '--bg-green-6a2d --text-white',
    },
    onClick: () => {
      emits('click:save')
    },
  },
])
</script>

<template>
  <BuyMCardDefault class="text-center">
    <ul class="inline-flex m:flex-col-reverse m:gap-y-[24px] pt:items-center pt:gap-x-[24px]">
      <li class="m:w-[230px]" v-for="(item, index) in items" :key="`${item.label}_${index}`">
        <BuyMAnchor
          :text="item.label"
          :to="item.to"
          :setClass="{
            main: [item.class.main, '--oval --h-45 --px-30 --py-8 w-full shrink-0'],
            text: 'font-semibold',
          }"
          @click="item.onClick"
        />
      </li>
    </ul>
  </BuyMCardDefault>
</template>

<style></style>
