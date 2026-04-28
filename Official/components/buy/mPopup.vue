<script setup>
import { usePopupStore } from '@stores/popup.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const popup = usePopupStore()
const { alertData, confirmData, customData, apiPromiseData } = storeToRefs(popup)
const { onReset } = useBuyPopupActions()

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

const isShowOverlay = ref(false)
const isShowPopup = ref(false)

const isOpen = computed(() => keyID.value && props.id === keyID.value)
const keyID = computed(
  () => alertData.value.id || confirmData.value.id || customData.value.id || apiPromiseData.value.id
)

const hasExistClose = computed(() => {
  const alertClose = keyID.value === 'alertSystem' ? alertData.value.hasExistClose : false
  const confirmClose = keyID.value === 'confirmSystem' ? confirmData.value.hasExistClose : false
  const customClose =
    keyID.value !== 'alertSystem' &&
    keyID.value !== 'confirmSystem' &&
    keyID.value !== 'apiAwaitSystem'
      ? customData.value.hasExistClose
      : false
  const awaitClose = keyID.value === 'apiAwaitSystem' ? apiPromiseData.value.hasExistClose : null

  return alertClose || confirmClose || customClose || awaitClose
})

const title = computed(
  () => alertData.value.title || confirmData.value.title || customData.value.title
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

const onOverlayEnter = () => {
  // overlay 出現後 → 開 popup
  if (isOpen.value) {
    isShowPopup.value = true
  }
}

// bomb 關閉完後，再把 overlay 收掉
const onAfterLeave = () => {
  isShowOverlay.value = false
}

watchEffect(() => {
  if (isOpen.value) {
    isShowOverlay.value = true
  } else {
    // 關閉時先收 popup
    isShowPopup.value = false
  }
})
</script>

<template>
  <Transition name="popup-overlay" appear @enter="onOverlayEnter">
    <div
      class="m-popup fixed inset-0 z-[5] flex items-center justify-center"
      :class="setClass.main"
      v-if="isOpen || isShowOverlay"
    >
      <Transition name="popup-bomb" appear @after-leave="onAfterLeave">
        <div
          class="m-popup-container relative flex max-h-[92%] flex-col overflow-hidden bg-[--white] m:mx-[16px] tm:rounded-[15px] p:rounded-[20px] p:pb-[40px]"
          :class="setClass.container"
          v-if="isShowPopup"
        >
          <button
            type="button"
            class="absolute right-[20px] top-[25px] flex items-center justify-center text-[--gray-666] transition-colors duration-300 p:h-[40px] p:w-[40px] p:p-[12px]"
            @click="onReset"
            v-if="hasExistClose"
          >
            <CommonSvgIcon icon="icon_xmark" />
          </button>
          <div class="m-popup-header shrink-0" :class="setClass.header" v-if="title">
            <slot name="header">
              <p
                class="flex items-center bg-[--blue-efef] p:h-[85px] p:px-[50px] p:text-[24px]"
                :class="setClass.headerTitle"
              >
                <b class="font-medium" v-html="title" />
              </p>
            </slot>
          </div>
          <div
            class="m-popup-body grow overflow-hidden overflow-y-auto border-t-transparent p:border-t-[30px] p:px-[50px]"
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
@keyframes popup-bomb {
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

.m-popup {
  &:before {
    @apply absolute inset-0 bg-[--black] opacity-40 content-default;
  }
}

@screen p {
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

@screen t {
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
