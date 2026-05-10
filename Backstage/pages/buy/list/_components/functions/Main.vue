<script setup>
import SelectAll from '@pages/buy/list/_components/functions/SelectAll.vue'
import Events from '@pages/buy/list/_components/functions/Events.vue'
import SelectCount from '@pages/buy/list/_components/functions/SelectCount.vue'
import Sort from '@pages/buy/list/_components/functions/Sort.vue'

const emits = defineEmits([
  'click:renewal',
  'click:publish',
  'click:offline',
  'click:deal',
  'click:copy',
])
const props = defineProps({
  eventsItems: {
    type: Array,
    default: () => [],
  },
})

const onClick = (id) => {
  emits(`click:${id}`)
}
</script>

<template>
  <div class="border-b-[2px] border-b-[--gray-e5] pt:flex pt:items-center p:px-[16px] p:pb-[16px]">
    <div class="flex items-center pt:grow p:gap-x-[24px]">
      <SelectAll />
      <Events
        :items="props.eventsItems"
        @click:renewal="onClick('renewal')"
        @click:publish="onClick('publish')"
        @click:offline="onClick('offline')"
        @click:deal="onClick('deal')"
        @click:copy="onClick('copy')"
      />
      <SelectCount />
    </div>
    <Sort />
  </div>
</template>

<style lang="postcss"></style>
