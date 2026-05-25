<script setup>
import { onFormErrorScrollToElem } from '@js/_prototype.js'

import { Form } from 'vee-validate'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件資料編輯',
})

// const common = useCommonStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyProject = useBuyProjectStore()
const { onApiPOSTRealEstateRestoreToOnline } = useBuyProjectActions()
const buyPublish = useBuyPublishStore()
const { statusData } = storeToRefs(buyPublish)

const {
  onAllPromise,
  onApiGERealEstateCaseStatus,
  onApiGETRealEstate,
  onApiPOSTRealEstateDraft,
  onApiPOSTRealEstate,
} = useBuyPublishActions()
const { onAlert, onConfirm, onApiPromise } = useBuyPopupActions()
const route = useRoute()
const router = useRouter()
const hfID = computed(() => route.params.id)

const onAlertSuccess = async (content) => {
  return await onAlert({
    title: '刊登物件',
    icon: 'icon_check_solid',
    content,
    setClass: {
      icon: 'text-[--orange-e646]',
      content: 'text-[--gray-666] tracking-wider',
    },
  })
}

const onDraft = async () => {
  onApiPromise('close')

  const { status } = await onApiPOSTRealEstateDraft(hfID.value)

  onApiPromise('close')

  if (status === 200) {
    await onAlertSuccess('儲存草稿成功')
  }
}

const onSave = async (validate) => {
  const { valid, errors } = await validate()

  if (valid) {
    onApiPromise('close')

    const { status } = await onApiPOSTRealEstate(hfID.value)

    onApiPromise('close')

    if (status === 200) {
      await onAlertSuccess('儲存成功')
    }
  } else {
    onFormErrorScrollToElem(errors)
  }
}

const onRenewal = async (validate) => {
  const { valid, errors } = await validate()

  if (valid) {
    const { isExpired, caseStatus } = statusData.value || {}

    if (isExpired) {
      onApiPromise('open')

      const { status } = await onApiPOSTRealEstate(hfID.value)

      onApiPromise('close')

      if (status === 200) {
        const isAlert = await onAlertSuccess('儲存成功')

        if (isAlert) {
          router.push({
            name: 'buy-publish-renewal-id',
            params: {
              id: hfID.value,
            },
          })
        }
      }
    } else {
      const isConfirm = await onConfirm({
        title: '刊登物件',
        icon: 'icon_check_solid',
        content: '物件仍在刊登效期內，無需使用刊登額度<br />確定要刊登物件嗎？',
        btns: [
          {
            label: '返回',
            class: '--border-gray-e5 --text-gray-666',
            type: 'cancel',
            isClose: true,
          },
          {
            label: '確定刊登',
            class: '--bg-green-6a2d --text-white',
            type: 'sure',
            isClose: true,
          },
        ],
        setClass: {
          icon: 'text-[--orange-e646]',
          content: 'text-[--gray-666] tracking-wider',
        },
      })

      if (isConfirm && caseStatus === 4) {
        onApiPromise('open')

        const { status } = await onApiPOSTRealEstateRestoreToOnline([hfID.value])

        onApiPromise('close')

        if (status === 200) {
          router.push({
            name: 'buy-publish-finish-id',
            params: route.params,
          })
        }
      }
    }
  } else {
    onFormErrorScrollToElem(errors)
  }
}

await onWithLoadingAll([
  ...onAllPromise(),
  useAsyncData(`case-status-basic-${hfID.value}`, () => onApiGERealEstateCaseStatus(hfID.value)),
  useAsyncData(`detail-${hfID.value}`, () => onApiGETRealEstate(hfID.value)),
])

onUseMeta({
  title: `物件管理 - 資料編輯 | ${buyProject.NAME}`,
  description: '',
  url: useRequestURL(),
})
</script>

<template>
  <!-- {{ statusData }} -->
  <BuyMContainer
    :setClass="{
      main: '--px-16',
    }"
  >
    <template #tools>
      <PageBuyPublishBackStepNew
        :anchor="{
          to: {
            name: buyPublish.statusMap[statusData.caseStatus],
            query: {
              pg: 1,
            },
          },
        }"
        :active="0"
      />
      <!-- <BackStepEdit
        :anchor="{
          to: {
            name: 'buy-parking-id',
            params: {
              id: hfID,
            },
          },
        }"
      /> -->
    </template>
    <Form
      as="div"
      class="tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]"
      v-slot="{ validate }"
    >
      <!-- <pre>{{ apiData }}</pre> -->
      <PageBuyPublishBasicDataComponents />
      <PageBuyPublishBasicSubmitButtons
        @click:draft="onDraft"
        @click:save="() => onSave(validate)"
        @click:renewal="() => onRenewal(validate)"
      />
    </Form>
  </BuyMContainer>
  <PageBuyPublishBasicPopupAddressGoogleMap />
  <PageBuyPublishBasicPopupFeature />
  <PageBuyPublishBasicPopupTitleDeed />
</template>

<style lang="postcss"></style>
