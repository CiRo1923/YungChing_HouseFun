<script setup>
const popup = usePopupStore()
const { customCheck } = storeToRefs(popup)
const { onCustomClose } = useBuyPopupActions()

const formRef = ref(null)

const onSure = async () => {
  const validate = async () => await formRef.value?.form?.validate?.()
  const { valid } = await validate()

  if (!valid) return

  // 驗證通過才真正 resolve + close
  customCheck.value(true)
  onCustomClose()
}
</script>

<template>
  <BuyCustomPopup
    id="popupComment"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600',
      note: 'mt-[10px]',
    }"
    @sure="onSure"
  >
    <p class="mb-[15px] text-[20px] font-medium">留言瞭解更多或預約看房</p>
    <PageBuyCommonComment
      :setClass="{
        main: 'space-y-[15px]',
      }"
      ref="formRef"
    />
    <template #note>
      <p class="text-[12px] text-[--gray-666]">
        當撥打本案電話或留下資料預約看屋時，即表示您已了解並同意好房網會員及網友同意條款
        並成為本網站之會員
      </p>
    </template>
  </BuyCustomPopup>
</template>

<style lang="postcss"></style>
