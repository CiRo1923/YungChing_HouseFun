<script setup>
const popup = usePopupStore()
const { alertData, alertCheck } = storeToRefs(popup)
const { onAlertClose } = useBuyPopupActions()
const alert = computed(() => alertData.value || {})

const onClose = (item) => {
  const { type } = item
  const isSure = type === 'sure'

  alertCheck.value(isSure)
  onAlertClose()
}
</script>

<template>
  <BuyMPopupMain
    id="alertSystem"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
    }"
  >
    <div class="text-center leading-[1.7] m:text-[14px] pt:text-[20px]" v-html="alert.content" />
    <template #footer>
      <div class="text-center">
        <ul
          class="m:flex m:justify-center m:gap-[8px] t:gap-x-[8px] pt:inline-flex pt:items-center p:gap-x-[16px]"
        >
          <li
            class="m:max-w-[50%] m:flex-1 t:w-[150px] p:w-[200px]"
            v-for="(item, index) in alert.btns"
            :key="`custom_${item.label}_${index}`"
          >
            <BuyMAnchor
              :text="item.label"
              :setClass="{
                main: [item.class, '--oval --h-45 w-full'],
                text: 'font-normal',
              }"
              @click="onClose(item)"
            />
          </li>
        </ul>
      </div>
    </template>
  </BuyMPopupMain>
</template>

<style></style>
