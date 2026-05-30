<script setup>
const emits = defineEmits([
  'click:renewal',
  'click:publish',
  'click:offline',
  'click:deal',
  'click:copy',
  'click:remove',
  'sort:update',
])
const props = defineProps({
  eventsItems: {
    type: Array,
    default: () => [],
  },
})

const onSortUpdate = () => {
  emits('sort:update')
}

const onClick = (id) => {
  emits(`click:${id}`)
}
</script>

<template>
  <div
    class="flex border-b-[2px] border-b-[--gray-e5] pb-[16px] m:flex-wrap m:gap-y-[5px] pt:items-center p:gap-x-[24px] p:px-[16px]"
  >
    <PageBuyListFunctionsSelectAll />
    <PageBuyListFunctionsEvents
      :items="props.eventsItems"
      @click:renewal="onClick('renewal')"
      @click:publish="onClick('publish')"
      @click:offline="onClick('offline')"
      @click:deal="onClick('deal')"
      @click:copy="onClick('copy')"
      @click:remove="onClick('remove')"
    />
    <PageBuyListFunctionsSelectCount />
    <PageBuyListFunctionsSort @update="onSortUpdate" />
  </div>
</template>

<style lang="postcss"></style>
