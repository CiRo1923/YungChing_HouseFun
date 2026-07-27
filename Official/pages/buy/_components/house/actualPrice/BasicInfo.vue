<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const isEmpty = (value) => value == null || value === ''

const typeItems = computed(() =>
  [
    {
      label: props.item.caseType,
      class: '--bg-red-e786 --text-white',
    },
    {
      label: isEmpty(props.item.similarity) ? null : `相似 ${props.item.similarity} %`,
      class: '--border-blue-69c1 --text-blue-69c1',
    },
  ].filter((item) => !isEmpty(item.label))
)

const infoItems = computed(() =>
  [
    {
      label: isEmpty(props.item.room) ? null : `${props.item.room} 房`,
      class: '--bg-gray-f7 --text-gray-666',
    },
    {
      label: isEmpty(props.item.buildingAge) ? null : `屋齡 ${props.item.buildingAge} 年`,
      class: '--bg-gray-f7 --text-gray-666',
    },
    {
      label: isEmpty(props.item.floor) ? null : `${props.item.floor} 樓`,
      class: '--bg-gray-f7 --text-gray-666',
    },
  ].filter((item) => !isEmpty(item.label))
)
</script>

<template>
  <div class="m:space-y-[5px] pt:flex pt:items-center pt:gap-x-[6px]">
    <ul class="flex items-center gap-x-[6px]">
      <li v-for="(data, index) in typeItems" :key="`${data.label}_${index}`">
        <BuyMTagDefault
          :label="data.label"
          :setClass="{
            main: ['--rounded-3 --px-6 --h-20', data.class],
            label: 'text-[12px]',
          }"
        />
      </li>
    </ul>
    <ul class="flex items-center gap-x-[6px]">
      <li v-for="(data, index) in infoItems" :key="`${data.label}_${index}`">
        <BuyMTagDefault
          :label="data.label"
          :setClass="{
            main: ['--rounded-3 --px-6 --h-20', data.class],
            label: 'text-[12px]',
          }"
        />
      </li>
    </ul>
  </div>
</template>

<style lang="postcss"></style>
