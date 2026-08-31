<script setup>
import { onFormErrorScrollToElem } from '@js/_prototype.js'

import { Form } from 'vee-validate'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件資料編輯',
  // hfID 一定是數字。validate 在元件載入前就攔下,不會帶著壞掉的 id 去打 API,
  // 回 false 走的是共用的 404 頁(見專案根目錄 error.vue)
  validate: (route) => /^\d+$/.test(route.params.id),
})

// const common = useCommonStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyProject = useBuyProjectStore()
const {
  onApiGETRealEstateTypeSelectOptions,
  onApiGETRealEstateLegalUsageSelectOptions,
  onApiPOSTRealEstateRestoreToOnline,
  onApiGETRealEstateFeatureCheckOptions,
} = useBuyProjectActions()
const buyPublish = useBuyPublishStore()
const { apiData, pingData, statusData } = storeToRefs(buyPublish)

const {
  onAllPromise,
  onUnsavedChanges,
  onApiGERealEstateCaseStatus,
  onApiGETRealEstate,
  onApiPOSTRealEstateDraft,
  onApiPOSTRealEstate,
} = useBuyPublishActions()
const { onAlert, onConfirm, onApiPromise, onApiErrorServerToClient } = usePopupActions()
const route = useRoute()
const router = useRouter()
const hfID = computed(() => route.params.id)

// 坪數在 pingData 另存一份(單位換算用),一起納入比對,否則只改坪數會被當成沒改過
const { onSnapshotSave } = onUnsavedChanges(() => ({
  caseInfo: apiData.value,
  ping: pingData.value,
}))

const onTypeSelectOptionsUpdate = async () => {
  return await onApiGETRealEstateTypeSelectOptions()
}

const onUsageSelectOptionsUpdate = async () => {
  return await onApiGETRealEstateLegalUsageSelectOptions()
}

const onFeatureCheckOptionsUpdate = async () => {
  return await onApiGETRealEstateFeatureCheckOptions()
}

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
  onApiPromise('open')

  const { status } = await onApiPOSTRealEstateDraft(hfID.value)

  onApiPromise('close')

  // 成功後留在原頁繼續編輯,不導頁
  if (status === 200) {
    onSnapshotSave()
    await onAlertSuccess('儲存草稿成功')
  }
}

const onSave = async (validate) => {
  const { valid, errors } = await validate()

  if (valid) {
    onApiPromise('open')

    const { status } = await onApiPOSTRealEstate(hfID.value)

    onApiPromise('close')

    if (status === 200) {
      onSnapshotSave()
      await onAlertSuccess('儲存成功')
    }
  } else {
    onFormErrorScrollToElem(errors)
  }
}

const onRenewal = async (validate) => {
  const { valid, errors } = await validate()
  const onToFinish = () => {
    router.push({
      name: 'buy-publish-finish-id',
      params: route.params,
    })
  }

  if (valid) {
    const { isExpired, caseStatus } = statusData.value || {}
    console.log(isExpired)

    if (isExpired) {
      onApiPromise('open')

      const { status } = await onApiPOSTRealEstate(hfID.value)

      onApiPromise('close')

      if (status === 200) {
        onSnapshotSave()

        const { isSure } = await onAlertSuccess('儲存成功')

        if (isSure) {
          router.push({
            name: 'buy-publish-renewal-id',
            params: {
              id: hfID.value,
            },
          })
        }
      }
    } else {
      const { isSure } = await onConfirm({
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

      console.log(caseStatus)
      // caseStatus: 1 刊登 | caseStatus: 2 草稿 | caseStatus: 3 成交 | caseStatus: 4 下架 | caseStatus: 6 草稿 (待刊登)

      if (isSure) {
        if (caseStatus === 1) {
          onApiPromise('open')

          const { status } = await onApiPOSTRealEstate(hfID.value)

          onApiPromise('close')

          if (status === 200) {
            onSnapshotSave()
            await onAlertSuccess('儲存成功')
            onToFinish()
          }
        } else if (caseStatus === 4) {
          onApiPromise('open')

          const { status } = await onApiPOSTRealEstateRestoreToOnline([hfID.value])

          onApiPromise('close')

          if (status === 200) {
            onToFinish()
          }
        }
      }
    }
  } else {
    onFormErrorScrollToElem(errors)
  }
}

const onOptionsUpdate = async () => {
  await Promise.all([
    onTypeSelectOptionsUpdate(),
    onUsageSelectOptionsUpdate(),
    onFeatureCheckOptionsUpdate(),
  ])

  return true
}

await onWithLoadingAll([
  ...onAllPromise(),
  useAsyncData(`case-status-basic-${hfID.value}`, () => onApiGERealEstateCaseStatus(hfID.value)),
  useAsyncData(`detail-${hfID.value}`, () => onApiGETRealEstate(hfID.value)),
])

const { refresh: refreshOptions } = await useAsyncData(
  `publish-basic-options-${hfID.value}`,
  onOptionsUpdate
)

// 資料都就位後才立基準,否則載入途中的空值會被當成「使用者清空了欄位」
onSnapshotSave()

const onPurposeChange = async () => {
  await refreshOptions()
}

onUseMeta({
  title: `物件管理 - 資料編輯 | ${buyProject.NAME}`,
  description: '',
  url: useRequestURL(),
})

onMounted(() => {
  onApiErrorServerToClient()
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
    <Form as="div" class="relative tm:mt-[24px] p:mt-[32px]" v-slot="{ validate }">
      <!-- <pre>{{ apiData }}</pre> -->
      <PageBuyPublishBasicDataComponents @change:casePurpose="onPurposeChange" />
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
