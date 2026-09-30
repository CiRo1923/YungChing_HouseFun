<script setup>
import { Form } from 'vee-validate'

const emits = defineEmits(['submit'])

const onSumit = async (validate) => {
  const { valid } = await validate()

  if (!valid) return

  emits('submit')
}
</script>

<template>
  <Form as="div" class="space-y-[15px]" v-slot="{ validate }">
    <PageMemberUpgradePhoneNote />
    <PageMemberUpgradePhoneFormPhone @enter="onSumit(validate)" />
    <CommonMAnchor
      text="發送驗證碼"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSumit(validate)"
    />
  </Form>
</template>
