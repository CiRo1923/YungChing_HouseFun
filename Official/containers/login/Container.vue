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

const onClick = ({ item }) => {
  activeId.value = item.id

  // 兩個 tab 的欄位都設了 validateEvents 不含 modelUpdate,清值不會觸發驗證,
  // 所以這裡清完就結束 —— 不必再補驗一次去搶下最新結果、也不必回頭清錯誤。
  //
  // ⚠️ 別改用 resetForm():它會把欄位還原成「Field 註冊當下」的值,而切過去的那個
  //    tab 是此刻才掛載的 —— dev 模式 store 帶有預設帳密,剛清掉的值會被填回去。
  onReset()
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
        main: '--green-8b0d pt:--border-b p:--anchor-px-20 p:--anchor-py-10 tm:--anchor-px-15 t:--anchor-py-5',
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
