<script setup>
const popup = usePopupStore()
const { confirmData } = storeToRefs(popup)
const { onConfirmClose } = usePopupActions()

const confirm = computed(() => confirmData.value || {})

// 關閉即結算,resolver 交給 onConfirmClose 內的 onSettle 處理
const onClose = (item) => {
  onConfirmClose(item.type === 'sure', item)
}
</script>

<template>
  <CommonMPopupMain id="confirmSystem" :setClass="confirm.setClass">
    <div class="text-[16px]" :class="confirm.setClass?.content" v-html="confirm.content" />
    <template #footer>
      <div class="text-center">
        <ul
          class="m:grid m:grid-cols-2 m:gap-[8px] t:gap-x-[8px] pt:inline-flex pt:items-center p:gap-x-[16px]"
        >
          <li
            class="pt:min-w-[100px]"
            :class="{
              'm:col-span-2': confirm.btns.length % 2 === 1 && index === confirm.btns.length - 1,
            }"
            v-for="(item, index) in confirm.btns"
            :key="`confirm_${item.label}_${index}`"
          >
            <BuyMAnchor
              :text="item.label"
              :setClass="{
                main: [item.class, '--oval --h-45 --px-20 w-full'],
              }"
              @click="onClose(item)"
            />
          </li>
        </ul>
      </div>
    </template>
  </CommonMPopupMain>
</template>

<style></style>
