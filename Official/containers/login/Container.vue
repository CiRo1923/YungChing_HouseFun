<script setup>
import { Form } from 'vee-validate'

const { onReset } = useMemberProjectActions()
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
const formRef = ref(null)
// 當前 tab:送出時要靠它決定走帳密登入還是驗證碼登入,經 defineExpose 給外層讀。
// 預設值取第一個 tab —— 與 CommonMTabBorderBottom 的 config.active: 0 對應。
const activeId = ref(items[0].id)

const onClick = async ({ item }) => {
  activeId.value = item.id

  onReset()

  // 清值會讓 required 立刻報錯(Field 綁 modelValue,值一變就重新驗證),而那次驗證是
  // 非同步的 —— 先 resetForm 會被它稍後回填的結果蓋回來。
  // vee-validate 只採用「最後發起」的那次驗證結果,故先自己補驗一次搶下最新,
  // 等它結束後再 resetForm,紅字才不會又冒出來。
  //
  // tab 是 multiple 模式,切換動畫期間新舊兩組 Field 同時掛著,兩邊都會被清值觸發 →
  // 這裡要整個 form 一起補驗,不能只處理單一欄位。
  await nextTick()

  // 只清錯誤,不用 resetForm():resetForm 會把每個欄位還原成「Field 註冊當下」的值,
  // 而切過去的那個 tab 是此刻才掛載的 —— dev 模式 store 帶有預設帳密,
  // 於是剛被 onReset 清掉的值又被填回去。
  const { errors } = (await formRef.value?.validate()) ?? {}

  formRef.value?.setErrors(
    Object.fromEntries(Object.keys(errors ?? {}).map((name) => [name, undefined]))
  )
}

defineExpose({
  form: formRef,
  activeId,
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
        anchor: 'w-full text-[16px]',
        body: 'pt-[15px]',
      }"
      @click="onClick"
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
