<script setup>
import { Form } from 'vee-validate'

const memberCenter = useMemberCenterStore()
const { password } = storeToRefs(memberCenter)
const { onApiPostMemberPasswordChange } = useMemberCenterActions()

const emits = defineEmits(['complete'])
const apiData = computed(() => password.value.apiData)
// 既有密碼對不對只有後端知道(送出時才驗),所以訊息由這裡保管。
// 使用者一改動就清掉 —— 留著的話,改好了畫面上還是紅的。
const currentPasswordMessage = ref(null)

watch(
  () => apiData.value.currentPassword,
  () => {
    currentPasswordMessage.value = null
  }
)

const onSubmit = async (validate, setTouched) => {
  /* 送出時把所有欄位標成 touched —— mForm 的「碰過才即時驗」要靠它,
    少了這行,使用者補填時紅字不會即時消失(得等下一次送出)。
    詳見 components/common/mForm/.composables/useValidateEvents.js */
  setTouched(true)

  const { valid } = await validate()

  if (!valid) return

  const { status, data } = await onApiPostMemberPasswordChange()

  if (status === 200) {
    emits('complete')

    return
  }

  // 400 是可預期的既有密碼錯誤,訊息掛回密碼欄位下方。
  if (status === 400) currentPasswordMessage.value = data?.message
}
</script>

<template>
  <Form
    as="div"
    class="mx-auto space-y-[30px] m:rounded-[10px] m:bg-[--white] m:p-[20px] p:max-w-[400px]"
    v-slot="{ validate, setTouched }"
  >
    <div class="space-y-[10px]">
      <CommonMFormPassword
        name="currentPassword"
        v-model="apiData.currentPassword"
        :config="{
          placeholder: '請輸入密碼',
          validateEvents: ['blur', 'change'],
        }"
        :rules="{
          required: '請輸入密碼',
          custom: {
            valid: !currentPasswordMessage,
            errorMessage: currentPasswordMessage,
          },
        }"
        :setClass="{
          main: '--rounded --h-55 --px-12',
        }"
      />
      <div class="text-right">
        <CommonMAnchor
          text="忘記密碼"
          :to="{
            name: 'member-forget',
          }"
          :setClass="{
            main: 'text-[14px] underline',
          }"
        />
      </div>
      <CommonMFormPassword
        name="newPassword"
        v-model="apiData.newPassword"
        :config="{
          minlength: 6,
          maxlength: 12,
          placeholder: '請輸入新的密碼',
          validateEvents: ['blur', 'change'],
        }"
        :rules="{
          required: '請輸入新的密碼',
          custom: {
            valid:
              /^[A-Za-z0-9]{6,12}$/.test(apiData.newPassword) &&
              apiData.newPassword !== apiData.currentPassword,
            errorMessage: /^[A-Za-z0-9]{6,12}$/.test(apiData.newPassword)
              ? '新舊密碼不能相同，請重新輸入'
              : '請輸入 { minlength } ~ { maxlength } 位數字或英文，大小寫有別',
          },
        }"
        :setClass="{
          main: '--rounded --h-55 --px-12',
        }"
      />
      <CommonMFormPassword
        name="confirmPassword"
        v-model="apiData.confirmPassword"
        :config="{
          placeholder: '再次輸入新的密碼',
          validateEvents: ['blur', 'change'],
        }"
        :rules="{
          required: '再次輸入新的密碼',
          custom: {
            valid: apiData.newPassword === apiData.confirmPassword,
            errorMessage: '再次輸入與新密碼不一致，請重新輸入',
          },
        }"
        :setClass="{
          main: '--rounded --h-55 --px-12',
        }"
      />
    </div>
    <CommonMAnchor
      text="確認送出"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSubmit(validate, setTouched)"
    />
  </Form>
</template>
