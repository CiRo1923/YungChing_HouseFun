<script setup>
import { useBuyPopupStore } from '@stores/buy/popup.js'

const popup = useBuyPopupStore()
const alert = computed(() => popup.alertData || {})

const onClose = (item) => {
  const { type } = item
  const isSure = type === 'sure'

  alert.value.check(isSure)
  alert.value.close()
}
</script>

<template>
  <BuyMPopup
    id="alertSystem"
    :setClass="{
      main: 'p:--w-615 t:--w-460',
    }"
  >
    <div class="text-center" v-html="alert.content" />
    <template #footer>
      <div class="text-center">
        <ul class="inline-flex items-center m:gap-x-[8px] pt:gap-x-[12px]">
          <li
            class="tm:w-[140px] p:w-[210px]"
            v-for="(item, index) in alert.btns"
            :key="`custom_${item.label}_${index}`"
          >
            <BuyMAnchor
              :text="item.label"
              :setClass="{
                main: [item.class, 'w-full'],
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
