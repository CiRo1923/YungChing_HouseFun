<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <ul class="flex shrink-0 flex-wrap gap-[5px] m:mt-[5px] t:mt-[10px] p:mt-[20px]">
    <li v-if="props.item.isBelowActualPrice">
      <BuyMTagDefault
        label="真降價 低於實價"
        :setClass="{
          main: '--rounded-3 --bg-orange-feea --text-orange-e646 --px-10 --py-4',
          label: 'text-[12px]',
        }"
      />
    </li>
    <li v-for="(feature, index) in props.item.features" :key="`feature_${feature}_${index}`">
      <BuyMTagDefault
        :label="feature"
        :setClass="{
          main: '--rounded-3 --bg-orange-feea --text-orange-e646 --px-10 --py-4',
          label: 'text-[12px]',
        }"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
