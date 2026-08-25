<script setup>
import { Form } from 'vee-validate'

// const common = useCommonStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyProject = useBuyProjectStore()
const { renewal } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { statusData } = storeToRefs(buyPublish)
const { onApiGetPublishAvailablePlans, onApiPOSTPublishSubmit } = useBuyProjectActions()
const { onUnsavedChanges, onApiGERealEstateCaseStatus, onApiPOSTRealEstateReadToPublish } =
  useBuyPublishActions()
const { onAlert, onApiPromise, onApiErrorServerToClient } = usePopupActions()
const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()
const requestURL = useRequestURL()

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '出售物件刊登',
  // hfID 一定是數字。validate 在元件載入前就攔下,不會帶著壞掉的 id 去打 API,
  // 回 false 走的是共用的 404 頁(見專案根目錄 error.vue)
  validate: (route) => /^\d+$/.test(route.params.id),
})

const hfID = computed(() => route.params.id)

// 這頁使用者選的是刊登額度(renewal.apiData.planID)
const { onSnapshotSave } = onUnsavedChanges(() => renewal.value.apiData)

const onDraftSubmit = async () => {
  onApiPromise('open')

  const { status } = await onApiPOSTRealEstateReadToPublish(hfID.value)

  onApiPromise('close')

  if (status === 200) {
    onSnapshotSave()
    onAlert({
      content: '儲存成功',
    })
  }
}

const onSaveSubmit = async (validate) => {
  const { valid } = await validate()

  if (valid) {
    onApiPromise('open')

    const { status } = await onApiPOSTPublishSubmit([hfID.value])

    onApiPromise('close')

    if (status === 200) {
      onSnapshotSave()

      const isAlert = await onAlert({
        content: '物件刊登完成',
      })

      if (isAlert) {
        router.push({
          name: 'buy-publish-finish-id',
          params: route.params,
        })
      }
    }
  }
}

// 先取得 物件狀態
await useAsyncData(`case-status-renewal-${hfID.value}`, () =>
  onApiGERealEstateCaseStatus(hfID.value)
)

// 如果 額度沒有過期 isExpired (true 過期 / false 未過期) 無法進入頁面
if (!statusData.value.isExpired) {
  await nuxtApp.runWithContext(() =>
    navigateTo(
      {
        name: 'buy-publish-basic-id',
        params: route.params,
      },
      {
        replace: true,
      }
    )
  )
} else {
  await onWithLoadingAll([onApiGetPublishAvailablePlans(hfID.value)])
  // 資料就位後才立基準,否則載入途中的空值會被當成「使用者清空了選擇」
  onSnapshotSave()
}

onUseMeta({
  title: `物件管理 - 選擇額度 | ${buyProject.NAME}`,
  description: '',
  url: requestURL,
})

onMounted(() => {
  onApiErrorServerToClient()
})
</script>

<template>
  <BuyMContainer
    :setClass="{
      main: '--px-16',
    }"
    v-if="statusData.isExpired"
  >
    <template #tools>
      <PageBuyPublishBackStepNew
        :anchor="{
          to: {
            name: 'buy-publish-basic-id',
            params: route.params,
          },
        }"
        :active="1"
      />
    </template>
    <Form
      as="div"
      class="tm:mt-[24px] tm:space-y-[24px] p:mt-[32px] p:space-y-[32px]"
      v-slot="{ validate }"
    >
      <PageBuyPublishRenewalContent />
      <PageBuyPublishRenewalSubmitButtons
        @click:draft="onDraftSubmit()"
        @click:save="() => onSaveSubmit(validate)"
      />
    </Form>
  </BuyMContainer>
</template>

<style></style>
