<script setup>
import { Form } from 'vee-validate'

const { onReset } = useMemberProjectActions()
const formRef = ref(null)
const items = readonly([
  {
    id: 'password',
    label: '密碼登入',
  },
  {
    id: 'verifyCode',
    label: '驗證碼登入',
  },
])

const onChanged = () => {
  formRef.value.resetForm()
  onReset()
}

defineExpose({
  form: formRef,
})
</script>

<template>
  <Form as="div" ref="formRef">
    <CommonMTabBorderBottom
      :items="items"
      :config="{
        active: 0,
        containerMode: 'multiple',
      }"
      :setClass="{
        main: '--green-8b0d pt:--has-border-b p:--anchor-px-20 p:--anchor-py-10 tm:--anchor-px-15 t:--anchor-py-5',
        header: 'flex items-center',
        headerItems: 'w-full',
        headerItem: 'flex-1',
        anchor: 'text-[16px]',
        body: 'pt-[15px]',
      }"
      @changed="onChanged"
    >
      <template #content_password>
        <LoginPassword />
      </template>
      <template #content_verifyCode>
        <LoginVerifyCode />
      </template>
    </CommonMTabBorderBottom>
  </Form>
</template>

<style lang="postcss"></style>
