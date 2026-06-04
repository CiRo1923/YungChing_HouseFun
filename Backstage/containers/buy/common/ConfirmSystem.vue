<script setup>
const popup = usePopupStore()
const { confirmData, confirmCheck } = storeToRefs(popup)
const { onConfirmClose } = useBuyPopupActions()

const confirm = computed(() => confirmData.value || {})

const onClose = (item) => {
  const { type } = item
  const isSure = type === 'sure'

  confirmCheck.value(isSure)
  onConfirmClose()
}
</script>

<template>
  <BuyMPopup id="confirmSystem" :setClass="confirm.setClass">
    <div
      class="text-center text-[16px]"
      :class="confirm.setClass?.content"
      v-html="confirm.content"
    />
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
  </BuyMPopup>
</template>

<style></style>
