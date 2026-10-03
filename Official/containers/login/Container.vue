<script setup>
import { Form } from 'vee-validate'

const { onReset } = useMemberAuthProjectActions()
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

// 點下去當下就切 activeId:滑動還沒結束前按登入,也要走新的那個 tab。
const onClick = ({ item }) => {
  activeId.value = item.id
}

// 清值等滑動結束才做。滑動期間舊的那個 tab 還掛著,在那時清值,
// 密碼欄的自訂規則會跟著重算而跳出紅字,整段滑動都看得到。
// 滑完舊的 tab 已經卸載,清掉的只剩 store 裡的值。
//
// 注意:別改用 resetForm():它會把欄位還原成「Field 註冊當下」的值,
//    不是 store 的 apiDefault —— 兩者不一致時,欄位會停在註冊當下的那一份。
const onChanged = () => {
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
