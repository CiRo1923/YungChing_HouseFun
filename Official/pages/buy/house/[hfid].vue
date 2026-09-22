<script setup>
definePageMeta({
  layout: 'buy',
  channel: 'buy',
  middleware: 'buy-house',
})

const { onUseMeta } = useCommonActions()
const { onApiGetBuyHouseHfidPoi } = useBuyHouseActions()
const { onApiGETRealEstateTypeSelectOptions } = useManageActions()
const { onRestoreChannel } = useBuyProjectActions()

// H1 由共用 Header 讀 project.seo.h1 輸出。物件本身(含 seo)在 middleware/buyHouse
// 就取好了 —— 頁首的渲染早於這裡的 setup,放在這一頁取的話 SSR 的 H1 會是空的。
// 換頁清空由 middleware/seoReset 處理(勿用 onUnmounted,會晚於新頁設值而誤清)。

const route = useRoute()
const hfid = computed(() => route.params.hfid)

// 明細頁 URL 只有 hfid、無 channel;由 cookie 還原(從列表帶來的 region / mrt)。
// cookie SSR 就讀得到,放 setup 讓 server 端輸出正確 HTML,避免 client 端閃跳。
onRestoreChannel()

// callOnce 而不是 useAsyncData:這幾支的回傳值沒有人讀,資料是由 action 寫進 store 的。
// useAsyncData 會把自己那份(空的)結果再序列化進 payload 一次,而真正的資料走 store 的 payload。
//
// 這裡用 Promise.all 而不是 awaitAllPromise:這是進入頁面的第一次取資料,
// 失敗要往上拋,伺服器端才會回 500。吞掉的話會送出一個內容是空的、狀態卻是 200 的頁面。
await Promise.all([
  callOnce('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  callOnce(`buy-detail-poi-${hfid.value}`, () => onApiGetBuyHouseHfidPoi(route)),
])

onUseMeta({
  url: useRequestURL(),
})

// 傳給 FixedBar 判斷捲動是否已離開物件主資訊(照片)區塊
const basicRef = ref(null)
</script>

<template>
  <div class="bg-[--white] py-[12px] tm:px-[10px]">
    <CommonMContainer class="p:--max-w-1220 p:--px-10 flex items-center">
      <PageBuyHouseBreadcrumbs
        :setClass="{
          main: 'grow',
        }"
      />
      <PageBuyHouseToolBar />
    </CommonMContainer>
  </div>
  <CommonMContainer class="p:--max-w-1220 p:--px-10 tm:space-y-[8px] p:mt-[45px] p:space-y-[12px]">
    <PageBuyHouseBasic ref="basicRef" />
    <PageBuyHouseFocus />
    <PageBuyHouseInformation />
    <PageBuyHouseFeatures />
    <PageBuyHouseEnvironment />
    <PageBuyHouseCommunity />
    <PageBuyHouseActualPrice />
    <PageBuyHousePoi />
    <PageBuyHouseAgentPick />
    <PageBuyHouseHotForYou />
    <!-- <PageBuyHouseConstruction /> -->
  </CommonMContainer>
  <!-- <PageBuyHousePopupAskMessage /> -->
  <PageBuyHouseFixedBar :basicEl="basicRef?.$el" />
  <BuyMTop />
  <PageBuyCommonPopupMessage />
  <PageBuyCommonPopupVerifyCode />
  <PageBuyCommonPopupCottonCandy />
  <PageBuyCommonPopupMessageSuccess />
  <PageBuyCommonPopupCottonCandySuccess />
  <PageBuyCommonPopupMessageFailed />
</template>
