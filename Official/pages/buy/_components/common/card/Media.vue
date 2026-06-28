<script setup>
const { onReplaceImageSize } = useBuyProjectActions()

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})
const size = {
  width: 510,
  height: 384,
}
const media = computed(() => props.item.media ?? [])
const hasImages = computed(() => media.value.images?.length !== 0)
const images = computed(() => (hasImages.value ? onReplaceImageSize(media.value.images, size) : []))
const badges = computed(() => props.item.badges ?? {})

const ids = computed(() => {
  const idsData = ['new']

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
  <div class="relative h-[192px] bg-[--gray-999]">
    <PageBuyCommonFlags
      :ids="ids"
      :setClass="{
        main: 'left-[5px] top-[5px]',
      }"
    />
    <PageBuyCommonFavorite
      :setClass="{
        main: 'absolute right-[5px] top-[5px] z-[1]',
        button: 'text-[--white]',
      }"
    />
    <CommonImgSrc
      :src="images[0]"
      :setClass="{
        main: 'relative h-full',
        img: 'absolute left-1/2 h-full -translate-x-1/2',
      }"
    />
    <PageBuyCommonBadges
      :data="badgesItems"
      :setClass="{
        main: 'bottom-[5px] left-[5px]',
      }"
    />
  </div>
</template>

<style></style>
