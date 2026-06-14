<script setup>
const buyHouse = useBuyHouseStore()
const { highlights } = storeToRefs(buyHouse)
const datas = computed(() => {
  return highlights.value.map((item) => ({
    label: item.title,
    content: item.context,
  }))
})
</script>

<template>
  <PageBuyHouseContent title="物件焦點">
    <div
      class="focus-container divide-y-[1px] divide-[--gray-ccce] tm:space-y-[20px] p:space-y-[30px]"
    >
      <ul>
        <li class="flex" v-for="(item, index) in datas" :key="`${item.label}_${index}`">
          <PageBuyHouseLabel :text="item.label" />
          <p>{{ item.content }}</p>
        </li>
      </ul>
    </div>
  </PageBuyHouseContent>
</template>

<style></style>
