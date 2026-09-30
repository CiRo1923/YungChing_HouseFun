<script setup>
import { Form } from 'vee-validate'

const { onApiPostMemberPasswordChange } = useMemberCenterActions()

const emits = defineEmits(['complete'])

const onSubmit = async (validate) => {
  const { valid } = await validate()

  if (!valid) return

  // 400 的訊息由 action 寫進 apiResult,密碼欄位自己讀。
  const { status } = await onApiPostMemberPasswordChange()

  if (status === 200) emits('complete')
}
</script>

<template>
  <Form
    as="div"
    class="mx-auto space-y-[30px] m:rounded-[10px] m:bg-[--white] m:p-[20px] p:max-w-[400px]"
    v-slot="{ validate }"
  >
    <PageMemberCenterPasswordForm />
    <CommonMAnchor
      text="確認送出"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSubmit(validate)"
    />
  </Form>
</template>
