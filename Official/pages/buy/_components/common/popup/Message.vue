<script setup>
const { onPopupVerifyCode } = useBuyProjectActions()
const { onCustomSettle } = usePopupActions()

const formRef = ref(null)

const onSure = async () => {
  const validate = async () => await formRef.value?.form?.validate?.()
  const { valid } = await validate()

  if (!valid) return

  // 驗證通過才回報結果;此處不關閉,交由後續流程接手畫面
  onCustomSettle(true)

  await onPopupVerifyCode()
}
</script>

<template>
  <CommonCustomPopup
    id="popupMessage"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
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
  </CommonCustomPopup>
</template>

<style lang="postcss"></style>
