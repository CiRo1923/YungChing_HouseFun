<script setup>
import { Form } from 'vee-validate'

const buyProject = useBuyProjectStore()
const { apiMessageData } = storeToRefs(buyProject)

const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const formRef = ref(null)
const model = computed(() => {
  const { name, phone, message } = apiMessageData.value

  if (!name || !phone || !message) return { type: 'required', isError: true }
  if (!/^09\d{8}$/.test(phone)) return { type: 'phone', isError: true }

  return { type: 'success', isError: false }
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

defineExpose({
  form: formRef,
})
</script>

<template>
  <Form as="div" :class="setClass.main" ref="formRef">
    <BuyMFormHidden
      v-model="model.isError"
      :rules="{
        custom: {
          valid: !model.isError,
          errorMessage: model.type === 'phone' ? '請輸入正確聯絡手機' : '請輸入完整留言資料',
        },
      }"
      v-slot="{ isError }"
    >
      <ul class="flex flex-wrap gap-[8px] overflow-hidden">
        <li class="min-w-0 flex-1">
          <BuyMFormInput
            name="name"
            v-model="apiMessageData.name"
            :config="{
              placeholder: '您的稱呼',
              isError: isError,
            }"
            :setClass="{
              main: '--rounded --px-12 --py-8 p:--h-45',
            }"
          />
        </li>
        <li class="min-w-0 flex-1">
          <BuyMFormInput
            name="phone"
            v-model="apiMessageData.phone"
            :config="{
              placeholder: '聯絡手機',
              length: 10,
              inputMode: 'tel',
              integer: true,
              inputChinese: false,
              isError: isError,
            }"
            :setClass="{
              main: '--rounded --px-12 --py-8 p:--h-45',
            }"
          />
        </li>
        <li class="w-full">
          <BuyMFormTextArea
            name="message"
            v-model="apiMessageData.message"
            :config="{
              placeholder: '請輸入留言',
              rows: 3,
              isError: isError,
            }"
            :setClass="{
              main: '--rounded --px-12 --py-8',
            }"
          />
        </li>
      </ul>
    </BuyMFormHidden>
    <slot name="tools" />
  </Form>
</template>

<style lang="postcss"></style>
