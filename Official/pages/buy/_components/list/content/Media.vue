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
</script>

<template>
  <div
    class="relative order-1 shrink-0 overflow-hidden rounded-[8px] bg-[--gray-999] m:mb-[6px] m:h-[270px] m:w-full pt:h-[190px] pt:w-[250px]"
  >
    <PageBuyListContentFlags :ids="ids" />
    <CommonImgSrc
      :src="hasImages ? images[0] : 'common/default_image.jpg'"
      :setClass="{
        main: 'relative h-full',
        img: 'absolute left-1/2 h-full -translate-x-1/2',
      }"
    />
  </div>
</template>

<style></style>
