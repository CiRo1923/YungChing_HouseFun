<script setup>
import { useBuyPopupStore } from '@stores/buy/popup.js'

const popup = useBuyPopupStore()

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
})

const keyID = computed(
  () => popup.alertData.id || popup.confirmData.id || popup.customData.id || popup.apiRunData.id
)

const isExistClose = computed(() => {
  const alertClose = keyID.value === 'alertSystem' ? popup.alertData.isExistClose : false
  const confirmClose = keyID.value === 'confirmSystem' ? popup.confirmData.isExistClose : false
  const popClose =
    keyID.value !== 'alertSystem' &&
    keyID.value !== 'confirmSystem' &&
    keyID.value !== 'apiAwaitSystem'
      ? popup.customData.isExistClose
      : false
  const awaitClose = keyID.value === 'apiAwaitSystem' ? popup.apiAwaitData.isExistClose : null

  return alertClose || confirmClose || popClose || awaitClose
})

const title = computed(
  () => popup.alertData.title || popup.confirmData.title || popup.customData.title
)

const onClose = () => {
  popup.alertData.close()
  popup.confirmData.close()
  popup.customData.close()
}
</script>

<template>
  <Transition name="popup-overlay" appear>
    <div
      class="m-popup fixed inset-0 z-[5] flex items-center justify-center"
      v-if="keyID && props.id === keyID"
    >
      <Transition name="bomb" appear>
        <div
          class="m-popup-container relative flex max-h-[92%] flex-col bg-[--white] tm:rounded-[15px] p:rounded-[20px]"
        >
          <button
            type="button"
            class="absolute right-[20px] top-[25px] flex items-center justify-center transition-colors duration-300"
            @click="onClose"
            v-if="isExistClose"
          >
            <SvgIcon icon="times" class="text-[--white]" />
          </button>
          <div class="m-popup-header shrink-0" v-if="title">
            <slot name="header">
              <p class="text-center">
                <b v-html="title" />
              </p>
            </slot>
          </div>
          <div class="m-popup-body grow overflow-hidden overflow-y-auto">
            <slot />
          </div>
          <footer class="m-popup-footer" v-if="$slots.ft">
            <slot name="footer" />
          </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style src="@css/_modules/_vueTransition.css"></style>
<style></style>
