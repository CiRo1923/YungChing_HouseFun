<script setup>
import { numberComma } from '@js/_prototype.js'

// 關注社區新上架的主體。依規格書 C203-1 §四「關注社區新上架」:
// 通知有兩個連結 —— 社區名稱(另開社區明細頁)、立即查看(另開該社區的待售物件列表)。
//
// 句子由前端組:社區名要是連結、筆數要上色,整句一個字串的話做不到。
// 筆數暫取 newListingCount(swagger 只替配對物件寫了說明),已列進 api 待確認文件。
const emits = defineEmits(['delete'])
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const onDelete = () => emits('delete')
</script>

<template>
  <div class="min-w-0 grow m:space-y-[10px] pt:flex pt:items-center pt:gap-x-[20px]">
    <div class="min-w-0 grow space-y-[3px]">
      <p class="text-[16px]">
        您關注的社區
        <!-- 兩個連結的落點(社區明細頁、社區待售物件列表)都還沒有來源 —— 先掛空的,
          樣式與位置照設計稿。網址有了之後依規格書另開新分頁。 -->
        <CommonMAnchor
          :text="props.item.community?.name"
          href="javascript:;"
          :setClass="{
            main: 'mx-[5px] inline',
            text: 'text-[--orange-e646] underline',
          }"
        />
        有
        <b class="mx-[5px] font-normal text-[--orange-e646]">
          {{ numberComma.add(props.item.newListingCount ?? 0) }}
        </b>
        筆新物件上架了，
        <CommonMAnchor
          text="立即查看"
          href="javascript:;"
          :setClass="{
            main: 'ml-[5px] inline',
            text: 'underline',
          }"
        />
      </p>
      <PageMemberCenterNoticeContentCardSentAt :item="props.item" />
    </div>
    <PageMemberCenterNoticeContentCardDelete @delete="onDelete" />
  </div>
</template>
