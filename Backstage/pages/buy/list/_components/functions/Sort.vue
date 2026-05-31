<script setup>
const buyList = useBuyListStore()
const { apiData } = storeToRefs(buyList)

const emits = defineEmits(['update'])
const options = shallowReadonly([
  {
    label: '預設',
    value: 0,
  },
  {
    label: '刊登日',
    value: 1,
    sort: {
      asc: {
        label: '舊',
        value: 1,
      },
      desc: {
        label: '新',
        value: 2,
      },
    },
  },
  {
    label: '到期日',
    value: 2,
    sort: {
      asc: {
        label: '舊',
        value: 1,
      },
      desc: {
        label: '新',
        value: 2,
      },
    },
  },
  {
    label: '留言數',
    value: 3,
    sort: {
      asc: {
        label: '少',
        value: 1,
      },
      desc: {
        label: '多',
        value: 2,
      },
    },
  },
  {
    label: '瀏覽數',
    value: 4,
    sort: {
      asc: {
        label: '少',
        value: 1,
      },
      desc: {
        label: '多',
        value: 2,
      },
    },
  },
])

const onClick = (item) => {
  const { value } = item
  const isObject = typeof value === 'object'
  apiData.value.listSortToken = isObject ? value.key : value
  apiData.value.listOrderToken = isObject ? value.sort : 2

  emits('update')
}
</script>

<template>
  <div class="ml-auto flex items-center m:order-4">
    <span
      class="relative text-[14px] text-[--gray-666] after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-[--gray-ccce] after:content-default tm:mr-[8px] tm:pr-[8px] p:mr-[16px] p:pr-[16px]"
    >
      排序
    </span>
    <BuyMSortMain
      :options="options"
      :config="{
        index: 0,
        mode: {
          m: 'dropdown',
        },
      }"
      @click="onClick"
    />
  </div>
</template>

<style lang="postcss"></style>
