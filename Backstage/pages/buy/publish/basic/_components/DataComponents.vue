<script setup>
const cardFilterModules = import.meta.glob('./CardFilter*.vue', {
  eager: true,
  import: 'default',
})

const buyPublish = useBuyPublishStore()

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
</script>

<template>
  <ul class="tm:space-y-[24px] p:space-y-[32px]">
    <template v-for="(item, index) in buyPublish.components" :key="`${item.id}_${index}`">
      <li v-if="componentMap[item.id]">
        <component :is="componentMap[item.id]" :title="item.label" />
      </li>
    </template>
  </ul>
</template>

<style></style>
