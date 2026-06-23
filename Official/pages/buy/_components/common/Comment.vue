<script setup>
import { Form } from 'vee-validate'

const buyHouse = useBuyHouseStore()
const { apiCommentData } = storeToRefs(buyHouse)

const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const formRef = ref(null)
const model = computed(() => {
  const { name, phone, message } = apiCommentData.value

  return !name || !phone || !message
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
      v-model="model"
      :rules="{
        custom: {
          valid: !model,
          errorMessage: '請輸入完整留言資料',
        },
      }"
      v-slot="{ isError }"
    >
      <ul class="flex flex-wrap gap-[8px] overflow-hidden">
        <li class="min-w-0 flex-1">
          <BuyMFormInput
            name="name"
            v-model="apiCommentData.name"
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
            v-model="apiCommentData.phone"
            :config="{
              placeholder: '聯絡手機',
              length: 10,
              inputMode: 'tel',
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
            v-model="apiCommentData.message"
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
