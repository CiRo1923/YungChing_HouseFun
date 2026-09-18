<script setup>
import { Form } from 'vee-validate'

const { onApiPutMemberProfile } = useMemberCenterActions()
const { onAlert } = usePopupActions()

const emits = defineEmits(['complete'])

const onSubmit = async (validate, setTouched) => {
  /* 送出時把所有欄位標成 touched —— mForm 的「碰過才即時驗」要靠它,
    少了這行,使用者補填時紅字不會即時消失(得等下一次送出)。
    詳見 components/common/mForm/.composables/useValidateEvents.js */
  setTouched(true)

  const { valid } = await validate()

  if (!valid) return

  const { status, data } = await onApiPutMemberProfile()

  if (status === 200) {
    emits('complete')

    return
  }

  // 400 的原因對不到某一個欄位,所以顯示在彈窗而不是欄位下方。
  if (status === 400) onAlert({ content: data?.message })
}
</script>

<template>
  <Form
    as="div"
    class="mx-auto space-y-[30px] m:rounded-[10px] m:bg-[--white] m:p-[20px] p:max-w-[400px]"
    v-slot="{ validate, setTouched }"
  >
    <PageMemberCenterAccountInfo />
    <PageMemberCenterAccountForm />
    <CommonMAnchor
      text="確認修改"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSubmit(validate, setTouched)"
    />
  </Form>
</template>
