<script setup>
import { useBuyListStore } from '@stores/buy/list.js'

const buyList = useBuyListStore()
const { datas } = storeToRefs(buyList)
const isSelectAll = computed({
  get() {
    return datas.value && datas.value.length > 0 && datas.value.every((item) => item._isSelect)
  },
  set(value) {
    datas.value = datas.value.map((item) => ({
      ...item,
      _isSelect: value,
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
      label: 'text-[16px]',
    }"
  />
</template>

<style lang="postcss"></style>
