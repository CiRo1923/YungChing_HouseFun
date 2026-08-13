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
    <PageMemberUpgradeEmailFormEmail @enter="onSumit(validate)" />
    <CommonMAnchor
      text="進行驗證"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSumit(validate)"
    />
    <PageMemberUpgradeEmailRegister />
  </Form>
</template>

<style lang="postcss"></style>
