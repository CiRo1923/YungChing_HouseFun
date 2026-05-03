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

const icon = computed(() => alertData.value.icon || confirmData.value.icon || customData.value.icon)

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
          class="m-popup-container relative flex max-h-[92%] flex-col overflow-hidden rounded-[15px] bg-[--white] py-[40px] m:mx-[16px] tm:p-[32px] p:px-[72px]"
          :class="setClass.container"
          v-if="isShowPopup"
        >
          <div
            class="m-popup-header flex shrink-0 items-center border-b-[2px] border-b-[--orange-e646] pb-[24px] text-[--gray-333]"
            :class="setClass.header"
            v-if="title"
          >
            <slot name="header">
              <p
                class="flex grow items-center gap-x-[10px] text-[24px]"
                :class="setClass.headerTitle"
              >
                <CommonSvgIcon
                  :icon="icon"
                  class="h-[30px] w-[30px] p-[3px] text-[--gray-666]"
                  v-if="icon"
                />
                <b class="font-medium" v-html="title" />
              </p>
            </slot>
            <button
              type="button"
              class="flex h-[30px] w-[30px] shrink-0 items-center justify-center p-[8px] text-[--gray-ccce]"
              @click="onReset"
              v-if="hasExistClose"
            >
              <CommonSvgIcon icon="icon_xmark" class="h-full w-full" />
            </button>
          </div>
          <div
            class="m-popup-body scrollbar --y mt-[24px] grow overflow-hidden"
            :class="setClass.body"
          >
            <slot />
          </div>
          <footer class="m-popup-footer mt-[24px]" :class="setClass.footer" v-if="$slots.footer">
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
    &.\-\-w-1200,
    &.p\:\-\-w-1200,
    &.pt\:\-\-w-1200 {
      .m-popup-container {
        @apply w-[1200px];
      }
    }

    &.\-\-w-800,
    &.p\:\-\-w-800,
    &.pt\:\-\-w-800 {
      .m-popup-container {
        @apply w-[800px];
      }
    }

    &.\-\-w-720,
    &.p\:\-\-w-720,
    &.pt\:\-\-w-720 {
      .m-popup-container {
        @apply w-[720px];
      }
    }

    &.\-\-w-600,
    &.p\:\-\-w-600,
    &.pt\:\-\-w-600 {
      .m-popup-container {
        @apply w-[600px];
      }
    }
  }
}

@screen t {
  .m-popup {
    &.\-\-w-1200,
    &.pt\:\-\-w-1200,
    &.tm\:\-\-w-1200,
    &.t\:\-\-w-1200 {
      .m-popup-container {
        @apply w-[1200px];
      }
    }

    &.\-\-w-800,
    &.pt\:\-\-w-800,
    &.tm\:\-\-w-800,
    &.t\:\-\-w-800 {
      .m-popup-container {
        @apply w-[800px];
      }
    }

    &.\-\-w-720,
    &.pt\:\-\-w-720,
    &.tm\:\-\-w-720,
    &.t\:\-\-w-720 {
      .m-popup-container {
        @apply w-[720px];
      }
    }

    &.\-\-w-600,
    &.pt\:\-\-w-600,
    &.tm\:\-\-w-600,
    &.t\:\-\-w-600 {
      .m-popup-container {
        @apply w-[600px];
      }
    }
  }
}
</style>
