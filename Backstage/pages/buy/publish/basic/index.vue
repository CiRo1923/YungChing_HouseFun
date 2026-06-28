<script setup>
// import { awaitAllPromise } from '@js/_prototype.js'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件刊登',
})

// const common = useCommonStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
// const buyPublish = useBuyPublishStore()
// const { apiData } = storeToRefs(buyPublish)
const { onApiPOSTRealEstateNewCase } = useBuyPublishActions()
const { onApiPromise } = useBuyPopupActions()
const router = useRouter()
// const newCaseAsync = useAsyncData('newCase', () => onApiPOSTRealEstateNewCase())

const onCreate = async () => {
  onApiPromise('open')
  const { status, data } = await onApiPOSTRealEstateNewCase()
  onApiPromise('close')

  if (status === 200) {
    const { hfID } = data

    router.push({
      name: 'buy-publish-basic-id',
      params: {
        id: hfID,
      },
    })
  }
}

await onWithLoadingAll([])

onUseMeta({
  title: `物件管理 - 資料編輯 | ${buyProject.NAME}`,
  description: '',
  url: useRequestURL(),
})
</script>

<template>
  <BuyMContainer
    :setClass="{
      main: '--px-16',
    }"
  >
    <BuyMAnchor
      text="物件刊登"
      :setClass="{
        main: '--h-35 --px-20 --oval --bg-green-6a2d --text-white',
      }"
      @click="onCreate"
    />
  </BuyMContainer>
</template>

<style lang="postcss"></style>
