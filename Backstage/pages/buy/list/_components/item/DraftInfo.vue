<script setup>
const emits = defineEmits(['click:publish'])
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
const isChecked = computed(() => props.data._checked.value)
const draftInfo = computed(() => props.data.caseDraftInfo || {})

const onClick = () => {
  emits('click:publish', props.data)
}
</script>

<template>
  <div
    class="flex min-h-[150px] flex-col items-center rounded-[15px] px-[32px] py-[24px] tracking-wider p:min-w-[320px] p:text-[16px]"
    :class="{
      'bg-[--gray-f7]': !isChecked,
      'bg-[--white]': isChecked,
    }"
  >
    <div class="grow text-center tracking-wider text-[--gray-666]">
      <p class="text-[16px]">
        <time :datetime="draftInfo.dateUpdate">{{ draftInfo.dateUpdate }}</time>
        {{ draftInfo.draftStatus }}
      </p>
      <span class="block text-[14px]" v-if="draftInfo.extraInfo">
        {{ draftInfo.extraInfo }}
      </span>
    </div>
    <div class="shrink-0">
      <BuyMAnchor
        text="刊登"
        :config="{
          isDisabled: !draftInfo.isReadToPublish,
        }"
        :setClass="{
          main: '--h-35 --px-20 --oval --bg-green-6a2d --text-white',
        }"
        @click="onClick"
      />
    </div>
  </div>
</template>

<style lang="postcss"></style>
