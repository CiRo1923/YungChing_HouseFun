<script setup>
const buyPublish = useBuyPublishStore()
const { statusData } = storeToRefs(buyPublish)

const emits = defineEmits(['click:draft', 'click:save', 'click:renewal'])

const items = computed(() => {
  const { caseStatus, isAllowRestoreToOnline } = statusData.value || {}

  return [
    {
      label: '取消',
      to: {
        name: buyPublish.statusMap[caseStatus],
        query: {
          pg: 1,
        },
      },
      class: {
        main: '--border-gray-e5 --bg-white --text-gray-666',
      },
      isHiden: false,
    },
    {
      label: '儲存',
      class: {
        main: '--border-gray-e5 --bg-white --text-gray-666',
      },
      isHiden: caseStatus !== 4,
      onClick: () => {
        emits('click:save')
      },
    },
    {
      label: '存成草稿',
      class: {
        main: '--border-gray-e5 --bg-white --text-gray-666',
      },
      isHiden: [1, 4].includes(caseStatus),
      onClick: () => {
        emits('click:draft')
      },
    },
    {
      label: '儲存，選擇刊登額度',
      class: {
        main: '--bg-green-6a2d --text-white',
      },
      isHiden: !isAllowRestoreToOnline,
      onClick: () => {
        emits('click:renewal')
      },
    },
  ]
})
</script>

<template>
  <BuyMCardDefault class="text-center">
    <ul class="inline-flex m:flex-col-reverse m:gap-y-[24px] pt:items-center pt:gap-x-[24px]">
      <template v-for="(item, index) in items" :key="`${item.label}_${index}`">
        <li class="m:w-[230px]" v-if="!item.isHiden">
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
      </template>
    </ul>
  </BuyMCardDefault>
</template>

<style></style>
