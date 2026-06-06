<script setup>
const buyList = useBuyListStore()
const { apiCommentsData, apiCommentUpdateData } = storeToRefs(buyList)
const { onCommentPopup, onApiPOSTCommentsUpdateReplyStatue } = useBuyListActions()
const { onCustom, onCustomClose, onAlert, onApiPromise } = useBuyPopupActions()

const REPLY_CONFIG = {
  reply: { statusText: '已回覆', isReply: 1 },
  noReply: { statusText: '未回覆', isReply: 2 },
}

const onReplyClick = async (type, item) => {
  const config = REPLY_CONFIG[type]
  if (!config) return

  const { statusText, isReply } = config
  const title = `設定為${statusText}`

  const { isSure: isCommentsReply } = await onCustom({
    id: 'popupCommentsReply',
    title,
    data: { type, item },
    icon: 'icon_circle_exclamation',
    btns: 'confirm',
  })

  // 取消設定 → 直接重開列表
  if (!isCommentsReply) {
    await onCommentPopup()
    return
  }

  apiCommentUpdateData.value.isReply = isReply
  onApiPromise('open')
  const { status } = await onApiPOSTCommentsUpdateReplyStatue()
  onApiPromise('close')

  if (status !== 200) return

  const { isSure } = await onAlert({
    title,
    icon: 'icon_smile',
    content: `留言已設定為 <b class="font-medium">[${statusText}]</b>`,
    setClass: {
      main: 'p:--w-800 t:--w-600',
      content: 'text-left text-[--gray-666]',
    },
  })

  if (isSure) await onCommentPopup()
}

const onClickSearch = async () => {
  apiCommentsData.value.page = 1

  // 先收掉目前彈窗，onApiPromise('open') 的 loading 才顯示得出來，
  // onCommentPopup 內部抓完資料後會再重新打開彈窗
  onCustomClose()

  await onCommentPopup()
}
</script>

<template>
  <BuyCommonCustomPopup
    id="popupComment"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
      body: 'pt:flex pt:flex-col',
    }"
  >
    <PageBuyListPopupCommentFilterAccordion @click:search="onClickSearch" />
    <PageBuyListPopupCommentDatas
      @click:reply="(item) => onReplyClick('reply', item)"
      @click:noReply="(item) => onReplyClick('noReply', item)"
    />
    <PageBuyListPopupCommentPagination />
  </BuyCommonCustomPopup>
</template>
