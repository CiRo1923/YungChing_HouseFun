<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyProject = useBuyProjectStore()
const { apiMessageData } = storeToRefs(buyProject)
const { onResetMessage, onPopupVerifyCode } = useBuyProjectActions()
const route = useRoute()

const formRef = ref(null)
const isDeviceM = computed(() => device.value === 'm')

const onSubmit = async () => {
  const validate = async () => await formRef.value?.form?.validate?.()
  const { valid } = await validate()

  if (valid) {
    await onPopupVerifyCode()
  }
}

const onInit = () => {
  onResetMessage()
  apiMessageData.value.houseId = route.params.hfid
}

onInit()
onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <PageBuyCommonComment
    :setClass="{
      main: 'space-y-[10px]',
    }"
    ref="formRef"
    v-if="!isDeviceM"
  >
    <template #tools>
      <BuyMAnchor
        text="預約留言"
        :setClass="{
          main: '--bg-green-8b0d --rounded --text-white p:--h-55 w-full',
        }"
        @click="onSubmit(validate)"
      />
      <p class="text-[12px] text-[--gray-999]">
        當撥打本案電話或留下資料預約看屋時，表示您已了解同意好房網會員及網友同意條款成為本網站之會員
      </p>
    </template>
  </PageBuyCommonComment>
</template>

<style lang="postcss"></style>
