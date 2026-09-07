<script setup>
import { Form } from 'vee-validate'

const emits = defineEmits(['submit'])

const onSumit = async (validate, setTouched) => {
  /* 送出時把所有欄位標成 touched —— mForm 的「碰過才即時驗」要靠它,
    少了這行,使用者補填時紅字不會即時消失(得等下一次送出)。
    詳見 components/common/mForm/.composables/useValidateEvents.js */
  setTouched(true)

  const { valid } = await validate()

  if (!valid) return

  emits('submit')
}
</script>

<template>
  <Form as="div" class="space-y-[15px]" v-slot="{ validate, setTouched }">
    <PageMemberUpgradeEmailFormEmail @enter="onSumit(validate, setTouched)" />
    <CommonMAnchor
      text="進行驗證"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSumit(validate, setTouched)"
    />
    <PageMemberUpgradeEmailRegister />
  </Form>
</template>
