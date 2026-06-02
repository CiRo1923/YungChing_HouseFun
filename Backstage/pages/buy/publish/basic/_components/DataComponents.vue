<script setup>
const cardFilterModules = import.meta.glob('./CardFilter*.vue', {
  eager: true,
  import: 'default',
})

const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

const emits = defineEmits(['change:casePurpose'])

const visibleComponents = computed(() => {
  const hiddenData = {
    5: ['CardFilterManage'], // 5 車位
    6: ['CardFilterManage', 'CardFilterParking'], // 6 土地
  }

  const casePurposeToken = apiData.value.caseInfo.casePurposeToken
  const hiddenComponents = hiddenData[casePurposeToken] ?? []

  return buyPublish.components.filter((item) => !hiddenComponents.includes(item.id))
})

const autoComponentMap = Object.fromEntries(
  Object.entries(cardFilterModules).map(([path, component]) => {
    const name = path.match(/\.\/(.+)\.vue$/)?.[1]

    return [name, component]
  })
)

// 之後假設有例外
// const overrideComponentMap = {
//   CardFilterSpecial: SpecialCard,
// }

const componentMap = {
  ...autoComponentMap,
  // ...overrideComponentMap,
}

const onChange = (item) => {
  const { id, hasEmits } = item

  if (hasEmits) emits(`change:${id}`)
}
</script>

<template>
  <ul class="tm:space-y-[24px] p:space-y-[32px]">
    <template v-for="(item, index) in visibleComponents" :key="`${item.id}_${index}`">
      <li v-if="componentMap[item.id]">
        <component :is="componentMap[item.id]" :title="item.label" @change="onChange" />
      </li>
    </template>
  </ul>
</template>

<style></style>
