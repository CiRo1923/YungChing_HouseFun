<script setup>
const memberCenter = useMemberCenterStore()
const { password } = storeToRefs(memberCenter)

const apiData = computed(() => password.value.apiData)
// 既有密碼對不對只有後端知道,送出時才驗;訊息由 action 寫進 apiResult。
const currentPasswordMessage = computed(() => password.value.apiResult?.message)

// 使用者一改動就清掉 —— 留著的話,改好了畫面上還是紅的。
watch(
  () => apiData.value.currentPassword,
  () => {
    password.value.apiResult = null
  }
)
</script>

<template>
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
</template>
