<script setup>
import { useBuyPopupStore } from '@stores/buy/popup.js'

const popup = useBuyPopupStore()

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  setClass: {
    type: Object,
    default: () => ({}),
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

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    headerTitle: '',
    body: '',
    footer: '',
    note: '',
    ...props.setClass,
  }
})

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
      :class="setClass.main"
      v-if="keyID && props.id === keyID"
    >
      <Transition name="popup-bomb" appear>
        <div
          class="m-popup-container relative flex max-h-[92%] flex-col bg-[--white] m:mx-[16px] tm:rounded-[15px] p:rounded-[20px]"
          :class="setClass.container"
        >
          <button
            type="button"
            class="absolute right-[20px] top-[25px] flex items-center justify-center transition-colors duration-300"
            @click="onClose"
            v-if="isExistClose"
          >
            <CommonSvgIcon icon="icon_xmark" class="text-[--white]" />
          </button>
          <div class="m-popup-header shrink-0" :class="setClass.header" v-if="title">
            <slot name="header">
              <p class="text-center" :class="setClass.headerTitle">
                <b v-html="title" />
              </p>
            </slot>
          </div>
          <div
            class="m-popup-body grow overflow-hidden overflow-y-auto p:px-[50px] p:pb-[40px] p:pt-[30px]"
            :class="setClass.body"
          >
            <slot />
          </div>
          <footer class="m-popup-footer p:mt-[25px]" :class="setClass.footer" v-if="$slots.footer">
            <slot name="footer" />
          </footer>
          <div class="m-popup-note" :class="setClass.note" v-if="$slots.note">
            <slot name="note" />
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style src="@css/_modules/_vueTransition.css"></style>
<style lang="postcss">
@keyframes bomb {
  0% {
    transform: scale(0);
  }
  25% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(0.9);
  }
  75% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@screep p {
  .m-popup {
    &.\-\-w-615,
    &.p\:\-\-w-615,
    &.pt\:\-\-w-615 {
      .m-popup-container {
        @apply w-[615px];
      }
    }

    &.\-\-w-460,
    &.p\:\-\-w-460,
    &.pt\:\-\-w-460 {
      .m-popup-container {
        @apply w-[460px];
      }
    }
  }
}

@screep t {
  .m-popup {
    &.\-\-w-615,
    &.pt\:\-\-w-615,
    &.tm\:\-\-w-615,
    &.t\:\-\-w-615 {
      .m-popup-container {
        @apply w-[615px];
      }
    }

    &.\-\-w-460,
    &.pt\:\-\-w-460,
    &.tm\:\-\-w-460,
    &.t\:\-\-w-460 {
      .m-popup-container {
        @apply w-[460px];
      }
    }
  }
}
</style>
