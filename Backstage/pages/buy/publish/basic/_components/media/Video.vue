<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

// host 白名單由 API 帶入；options 的 value 是字串，caseVideoTypeToken 走 v-model.number
const videoUrlRule = computed(() => {
  const { caseVideoTypeToken } = apiData.value.caseInfo
  const videoType = options.value.videoType?.find(
    (item) => Number(item.value) === caseVideoTypeToken
  )

  return {
    host: videoType?.host ?? [],
    errorMessage: videoType ? `請輸入正確的 ${videoType.text} 網址` : '請輸入正確的影音網址',
  }
})

// 使用者常直接貼上不含協定的網址（youtube.com/watch?v=xxx），離開欄位時自動補 https://
const onNormalizeVideoUrl = () => {
  const { caseInfo } = apiData.value
  const url = caseInfo.caseVideoUrl?.trim()

  if (!url) return

  // 協定相對網址（//youtube.com/...）
  if (/^\/\//.test(url)) {
    caseInfo.caseVideoUrl = `https:${url}`
    return
  }

  // 已帶協定者一律不改寫，留給格式驗證判斷（javascript: 不可被包裝成看似合法的網址）
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    caseInfo.caseVideoUrl = url
    return
  }

  caseInfo.caseVideoUrl = `https://${url}`
}
</script>

<template>
  <ul class="m:space-y-[12px] pt:flex pt:gap-x-[8px]">
    <li class="pt:w-[160px] pt:shrink-0">
      <CommonMFormSelect
        name="caseVideoTypeToken"
        v-model.number="apiData.caseInfo.caseVideoTypeToken"
        :options="options.videoType"
        :config="{
          placeholder: {
            value: '請選擇影音類型',
            isToOption: true,
          },
          schema: {
            label: 'text',
            value: 'value',
          },
        }"
        :setClass="{
          type: 'text-[16px]',
          main: '--h-40 --px-12 --py-8',
        }"
      />
    </li>
    <li class="pt:grow">
      <CommonMFormInput
        name="caseVideoUrl"
        v-model="apiData.caseInfo.caseVideoUrl"
        :config="{
          placeholder: '請輸入影音來源',
        }"
        :rules="{
          required: {
            valid: apiData.caseInfo.caseVideoTypeToken,
            errorMessage: '請輸入影音來源',
          },
          videoUrl: videoUrlRule,
        }"
        :setClass="{
          type: 'text-[16px]',
          main: '--h-40 --px-12 --py-8',
          element: 'grow',
        }"
        @blur="onNormalizeVideoUrl"
      />
    </li>
  </ul>
</template>

<style></style>
