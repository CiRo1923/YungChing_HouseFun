<script setup>
const { condition, onRemoveCondition } = useBuyListActions()

const emits = defineEmits(['routerPush'])

const onRemove = (item) => {
  // 先改 store(移除該筆),再請頁面 routePush → 改 URL 才真正套用並重查
  onRemoveCondition(item)
  emits('routerPush')
}
</script>

<template>
  <div
    class="mx-auto max-w-[725px] items-center py-[30px] m:space-y-[15px] pt:flex pt:gap-x-[35px]"
  >
    <CommonImgSrc
      src="common/no_data.svg"
      :setClass="{
        main: 'mx-auto h-[138px] w-[150px] shrink-0',
      }"
    />
    <div class="grow space-y-[15px] text-[--gray-666] m:text-center">
      <p class="text-[20px] font-bold">很抱歉，您所搜尋的條件目前沒有符合的物件可提供</p>
      <p class="tracking-wider">
        建議您可以收藏此搜尋條件，並且訂閱配對信，若有比對到符合的物件，我們會每週寄信通知您，讓您輕鬆找好房！
      </p>
      <CommonMAnchor
        text="訂閱搜尋條件"
        :config="{
          icon: {
            name: 'icon_bell',
            position: 'left',
          },
        }"
        :setClass="{
          main: '--bg-orange-e646 --text-white --oval --h-25 --px-20 gap-x-[5px]',
          text: 'text-[14px]',
          icon: 'h-[16px] w-[16px] p-[1px]',
        }"
      />
      <div class="space-y-[15px] border-t-[1px] border-t-[--gray-e5] pt-[15px]">
        <p class="text-[16px]">您也可以調整搜尋條件再試試</p>
        <ul class="flex flex-wrap items-center gap-[10px]">
          <li v-for="(item, index) in condition" :key="`${item.label}_${item.key}_${index}`">
            <BuyMTagClearButton
              :label="item.label"
              :setClass="{
                main: '--bg-gray-f2 --rounded-4 --h-30 --px-10 --hover-border-green-9c33 --hover-text-green-6a2d',
                label: 'text-[14px]',
              }"
              @click="onRemove(item)"
            />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
