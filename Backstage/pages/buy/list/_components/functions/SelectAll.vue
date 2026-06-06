<script setup>
const buyList = useBuyListStore()
const { searchDatas } = storeToRefs(buyList)
const isSelectAll = computed({
  get() {
    return (
      searchDatas.value &&
      searchDatas.value.length > 0 &&
      searchDatas.value.every((item) => item._checked.value)
    )
  },
  set(value) {
    searchDatas.value = searchDatas.value.map((item) => ({
      ...item,
      _checked: {
        ...item._checked,
        ...{ value },
      },
    }))
  },
})
</script>

<template>
  <BuyMFormCheckBox
    name="isSelectAll"
    v-model="isSelectAll"
    :config="{
      mode: 'boolean',
      label: '全選',
    }"
    :setClass="{
      main: 'm:order-1',
      label: 'text-[16px]',
    }"
  />
</template>

<style lang="postcss"></style>
