<script setup>
const popup = usePopupStore()
const { alertData } = storeToRefs(popup)
const { onAlertClose } = usePopupActions()
const alert = computed(() => alertData.value || {})
const setClass = computed(() => alert.value.setClass || {})

const onClose = (item) => {
  onAlertClose(item.type === 'sure', item)
}
</script>

<template>
  <CommonMPopupMain
    id="alertSystem"
    :setClass="{
      main: [setClass.main || 'p:--w-600 t:--w-460', 'p:--py-40 tm:--py-24 p:--px-60 tm:--px-30'],
    }"
  >
    <div
      class="text-center leading-[1.7]"
      :class="setClass.container || 'm:text-[14px] pt:text-[20px]'"
      v-html="alert.content"
    />
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
            <CommonMAnchor
              :text="item.label"
              :setClass="{
                main: [item.class, '--oval --h-45 --text-center w-full'],
                text: 'font-normal',
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
