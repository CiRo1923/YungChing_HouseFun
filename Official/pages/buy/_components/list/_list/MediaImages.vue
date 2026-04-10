<script setup>
const testImages = [1, 2, 3, 4]
const props = defineProps({
  datas: {
    type: Array,
    default: () => [],
  },
})
const hasImages = computed(() => props.datas && props.datas.length !== 0)
const images = computed(() => (hasImages.value ? props.datas : testImages))
const onImageSize = (image) => {
  const hasWidth = /\{0\}/.test(image)
  const hasHeight = /\{0\}/.test(image)
  let resultImage = image

  if (hasWidth) resultImage = resultImage.replace(/\{0\}/, 720)
  if (hasHeight) resultImage = resultImage.replace(/\{1\}/, 540)

  return resultImage
}
</script>

<template>
  <BuyMSwiper12
    name="houseMediaImages"
    :data="images"
    :config="{
      nav: true,
    }"
    :setClass="{
      main: 'h-full',
      nav: 'h-[30px] w-[30px] p-[6px] text-[--white]',
    }"
    v-slot="{ item }"
    v-if="hasImages"
  >
    <div class="flex h-full flex-col items-center justify-center break-keep">
      <!-- {{ onImageSize(item) }} -->
      <CommonImgSrc :src="onImageSize(item)" />
    </div>
  </BuyMSwiper12>
  <CommonImgSrc
    src="common/default_image.jpg"
    :setClass="{
      main: 'relative h-full',
      img: 'absolute left-1/2 h-full -translate-x-1/2',
    }"
    v-else
  />
</template>

<style></style>
