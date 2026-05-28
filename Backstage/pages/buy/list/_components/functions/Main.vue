<script setup>
const emits = defineEmits([
  'click:renewal',
  'click:publish',
  'click:offline',
  'click:deal',
  'click:copy',
  'click:remove',
  'update',
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
  <div class="border-b-[2px] border-b-[--gray-e5] px-[16px] pb-[16px] pt:flex pt:items-center">
    <div class="flex items-center pt:grow p:gap-x-[24px]">
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
    </div>
    <PageBuyListFunctionsSort @update="emits('update')" />
  </div>
</template>

<style lang="postcss"></style>
