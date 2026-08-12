<script setup>
import { Form } from 'vee-validate'

import { EMAILVALUE } from '@js/_storage.js'

const memberUpgrade = useMemberUpgradeStore()
const { upgrade } = storeToRefs(memberUpgrade)
const { onApiAuthEmailUpgradeVerificationCode, onSetCookie } = useMemberUpgradeActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

const emits = defineEmits(['reSend'])
const apiData = computed(() => upgrade.value.emailVerify.apiData)

const onReSend = () => {
  emits('reSend')
}

const onSumit = async (validate) => {
  const { valid } = await validate()

  if (!valid) return

  // onApiPromise('open')
  // const { status } = await onApiAuthEmailUpgradeVerificationCode()

  // onApiPromise('close')

  // if (status === 200) {

  // }
}
</script>

<template>
  {{ apiData }}
  <Form as="div" class="mt-[30px] space-y-[15px]" v-slot="{ validate }">
    <CommonMFormContinuous
      name="verificationCode"
      v-model="apiData.verificationCode"
      :rules="{
        required: '請輸入驗證碼',
      }"
    />
    <PageMemberUpgradeEmailVerifyCountdown @click="onReSend" />
    <CommonMAnchor
      text="進行驗證"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSumit(validate)"
    />
  </Form>
</template>

<style lang="postcss"></style>
