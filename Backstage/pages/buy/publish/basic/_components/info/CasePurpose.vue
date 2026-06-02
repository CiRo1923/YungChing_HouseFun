<script setup>
import { useForm } from 'vee-validate'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

const { resetField } = useForm()

const emits = defineEmits(['change'])

const onChange = async () => {
  // apiData.value.caseInfo.caseTypeToken = null
  // apiData.value.caseInfo.caseUsageToken = null
  // setFieldValue('caseTypeToken', null)
  // setFieldValue('caseUsageToken', null)

  // await nextTick()

  resetField('caseTypeToken', { value: null })

  // setFieldTouched('caseTypeToken', false)
  // setFieldTouched('caseUsageToken', false)

  // setFieldError('caseTypeToken', undefined)
  // setFieldError('caseUsageToken', undefined)

  emits('change')
}
</script>

<template>
  <BuyMFormRadiosOval
    name="casePurposeToken"
    v-model.number="apiData.caseInfo.casePurposeToken"
    :options="options.casePurpose"
    :config="{
      schema: {
        label: 'text',
        value: 'code',
      },
    }"
    :rules="{
      required: '請選擇現況',
    }"
    @change="onChange"
  />
</template>

<style></style>
