<script setup>
const { onReplaceImageSize } = useBuyProjectActions()
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})
const size = {
  width: 720,
  height: 540,
}

const mediaImages = computed(() => props.item?.media?.images ?? [])
const hasImages = computed(() => mediaImages.value.length !== 0)
const images = computed(() => (hasImages.value ? onReplaceImageSize(mediaImages.value, size) : []))
const badges = computed(() => props.item.badges ?? {})

const ids = computed(() => {
  const idsData = ['gold', 'new']

  return idsData.filter((key) => badges.value[key] === true)
})

const badgesItems = computed(() => {
  return [
    {
      id: 'vr',
      value: badges.value.vr,
    },
    {
      id: 'aiTour',
      value: badges.value.aiTour,
    },
    {
      id: 'aiDecor',
      value: badges.value.aiDecor,
    },
    {
      id: 'video',
      value: badges.value.videoTour,
    },
  ]
})
</script>

<template>
  <div
    class="relative order-1 shrink-0 overflow-hidden rounded-[8px] bg-[--gray-999] m:mb-[6px] m:h-[270px] m:w-full pt:h-[190px] pt:w-[250px]"
  >
    <PageBuyListContentFlags :ids="ids" />
    <PageBuyCommonBadges
      :data="badgesItems"
      :setClass="{
        main: 'bottom-[5px] left-[5px]',
      }"
    />
    <CommonImgSrc
      :src="images[0]"
      :setClass="{
        main: 'relative h-full',
        img: 'absolute left-1/2 h-full -translate-x-1/2',
      }"
    />
  </div>
</template>

<style></style>
