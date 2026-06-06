<script setup>
const buyList = useBuyListStore()
const { commentsDatas, apiCommentUpdateData } = storeToRefs(buyList)

const emits = defineEmits(['click:reply', 'click:noReply'])
const hasData = computed(() => commentsDatas.value.length !== 0)

const thead = readonly([
  {
    id: 'dateComment',
    label: '日期',
    isHide: {
      m: true,
    },
    class: {
      thead: 'text-left p:w-[135px]',
      tbody: 'text-[14px] tracking-wider',
    },
  },
  {
    id: 'sellTypeName',
    label: '類型',
    isHide: {
      m: true,
    },
    class: {
      thead: 'p:w-[45px]',
      tbody: 'text-[16px] tracking-wider pt:text-center',
    },
  },
  {
    id: 'pageSource',
    label: '頁面來源',
    class: {
      thead: 'p:w-[110px]',
      tbody: 'text-[16px] tracking-wider pt:text-center',
    },
  },
  {
    id: 'memberName',
    label: '姓名',
    class: {
      thead: 'p:w-[95px]',
      tbody: 'text-[16px] tracking-wider font-medium pt:text-center',
    },
  },
  {
    id: 'memberPhone',
    label: '連絡電話',
    isHide: {
      m: true,
    },
    class: {
      thead: 'p:w-[115px]',
      tbody: 'text-[16px] tracking-wider font-medium pt:text-center',
    },
  },
  {
    id: 'statueTokenName',
    label: '狀態',
    class: {
      thead: 'p:w-[65px]',
      tbody: 'text-[16px] tracking-wider pt:text-center m:!mt-[24px]',
    },
  },
  {
    id: 'content',
    label: '留言內容',
  },
  {
    id: 'action',
    label: '設定',
    class: {
      thead: 'p:w-[150px]',
      tbody: 'text-center m:!mt-[24px]',
    },
  },
])

const onFunctionsClick = (id) => {
  emits(`click:${id}`)
}

const onActionClick = (item) => {
  const { statueToken, commentID } = item

  apiCommentUpdateData.value.commentIDList = [commentID]

  if (!statueToken) emits(`click:reply`, item)
  if (statueToken) emits(`click:noReply`, item)
}
</script>
<template>
  <!-- {{ checkedIDs }} -->
  <div class="grow" v-if="hasData">
    <PageBuyListPopupCommentFuncitonsMain
      @click:reply="onFunctionsClick('reply')"
      @click:noReply="onFunctionsClick('noReply')"
    />
    <BuyMTableCheckboxResponsiv
      :thead="thead"
      :tbody="commentsDatas"
      :config="{
        isTheadFixed: true,
        schema: {
          isChecked: '_checked',
        },
      }"
      :setClass="{
        main: '--rounded-t --thead-gray-f2',
        container: 'p:max-h-[365px]',
        tbodyTr: 'm:space-y-[8px]',
      }"
    >
      <template #checkbox_m="{ tbody, index }">
        <time :datetime="tbody[index].dateComment" class="text-[14px]">
          {{ tbody[index].dateComment }}
        </time>
      </template>
      <template #pageSource="{ item }">
        <PageBuyListPopupCommentPageSourceAnchor :data="item" />
      </template>
      <template #pageSource_m="{ item }">
        <p class="flex items-center gap-x-[8px]">
          <span>{{ item.sellTypeName }}</span>
          <PageBuyListPopupCommentPageSourceAnchor :data="item" />
        </p>
      </template>
      <template #memberName_m="{ value, item }">
        <p class="flex items-center gap-x-[8px]">
          <span>{{ value }}</span>
          <span>{{ item.memberPhone }}</span>
        </p>
      </template>
      <template #statueTokenName="{ item, value }">
        <span :class="[{ 'text-[--orange-e646]': !item.statueToken }]">{{ value }}</span>
      </template>
      <template #content_m="{ value }">
        <div class="rounded-[15px] bg-[--gray-ed] p-[16px]">
          {{ value }}
        </div>
      </template>
      <template #action="{ item }">
        <BuyMAnchor
          :text="item.statueToken ? '設為未回覆' : '設為已回覆'"
          :setClass="{
            main: '--oval --border-gray-e5 --bg-white --text-gray-666 --h-35 --px-20',
            text: 'text-[16px]',
          }"
          @click="onActionClick(item)"
        />
      </template>
    </BuyMTableCheckboxResponsiv>
  </div>
  <PageBuyListPopupCommentNoData v-else />
</template>

<style lang="postcss"></style>
