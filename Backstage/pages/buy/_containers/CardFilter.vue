<script setup>
import CardFilter from '@components/buy/mCard/Filter.vue'
import FormLabel from '@components/buy/mForm/Label.vue'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <CardFilter :title="props.title">
    <ul class="tm:space-y-[40px] p:space-y-[24px]">
      <li
        class="m:space-y-[12px] pt:flex pt:gap-x-[8px]"
        v-for="(item, index) in props.items"
        :key="`${item.id}_${index}`"
      >
        <FormLabel
          :label="item.label"
          :config="{
            isRequired: item.isRequired,
          }"
          :setClass="{
            main: ['pt:flex pt:w-[100px] pt:shrink-0 pt:items-center', item.class],
          }"
          v-if="item.label"
        />
        <div class="pt:grow">
          <component :is="item.component" />
        </div>
      </li>
    </ul>
  </CardFilter>
</template>

<style></style>
