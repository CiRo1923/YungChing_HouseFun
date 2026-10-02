<script setup>
/* starter —— 這一支是起手樣板:複製一次,之後歸接手的專案所有。

  整套更新時**不要覆蓋它**。掛在版面上的這幾支容器決定這個站有哪幾種彈窗、
  各自的版面與預設 class,而那是每個站自己的事;它們與彈窗那支 store
  是一組(那邊有哪幾種,這邊就有對應的容器)。

  蓋過去等於把已經接好的那一套換成別人的 —— 不會報錯,
  要開啟那個彈窗才看得出來。 */

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
  <CommonMPopup id="confirmSystem" :setClass="confirm.setClass">
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
              :config="{ isDisabled: item.isDisabled }"
              :setClass="{
                main: [item.class, '--text-center --oval --h-45 --px-20 w-full'],
              }"
              @click="onClose(item)"
            />
          </li>
        </ul>
      </div>
    </template>
  </CommonMPopup>
</template>
