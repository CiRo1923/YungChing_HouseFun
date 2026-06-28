<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const popup = usePopupStore()
const { alertData, confirmData, customData, apiPromiseData } = storeToRefs(popup)
const { onReset } = useBuyPopupActions()

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  config: {
    type: Object,
    default: () => ({}),
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

const config = computed(() => {
  return {
    mode: 'zoom', // 'zoom' | 'bottomSheet' : {p: 'zoom' | 'bottomSheet', pt: 'zoom' | 'bottomSheet', tm: 'zoom' | 'bottomSheet', t: 'zoom' | 'bottomSheet', m: 'zoom' | 'bottomSheet'}`
    ...props.config,
  }
})

// 依 config.mode 解析當前模式；mode 為物件時用 device (p | t | m) 取值
const mode = computed(() => {
  const { mode } = config.value
  return typeof mode === 'object' && mode !== null ? mode[device.value] || 'zoom' : mode
})

// Transition name：popup-zoom | popup-bottomSheet
const transitionName = computed(() => `popup-${mode.value}`)

// container className：--zoom | --bottomSheet
const modeClass = computed(() => `--${mode.value}`)

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    icon: '',
    headerTitle: '',
    headerTools: '',
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

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <Transition name="popup-overlay" @enter="onOverlayEnter">
    <div
      class="m-popup fixed inset-0 z-[5] flex"
      :class="[modeClass, setClass.main]"
      v-if="isOpen || isShowOverlay"
    >
      <Transition :name="transitionName" @afterLeave="onAfterLeave">
        <div
          class="m-popup-container relative flex max-h-[92%] flex-col overflow-hidden bg-[--white] py-[40px] tm:px-[30px] tm:py-[24px] p:px-[60px]"
          :class="setClass.container"
          v-if="isShowPopup"
        >
          <div
            class="m-popup-header flex shrink-0 items-center border-b-[2px] border-b-[--green-8b0d] pb-[20px] m:flex-wrap"
            :class="setClass.header"
            v-if="title || $slots.headerTools"
          >
            <slot name="header">
              <p
                class="order-1 flex shrink-0 items-center gap-x-[10px] tm:text-[20px] p:text-[24px]"
                :class="setClass.headerTitle"
              >
                <CommonSvgIcon
                  :icon="icon"
                  class="h-[30px] w-[30px] p-[3px] text-[--gray-666]"
                  :class="setClass.icon || 'text-[--gray-666]'"
                  v-if="icon"
                />
                <b class="font-medium" v-html="title" />
              </p>
            </slot>

            <button
              type="button"
              class="ml-auto flex h-[24px] w-[24px] shrink-0 items-center justify-center p-[5px] text-[--gray-666] m:order-2 pt:order-3"
              @click="onReset"
              v-if="hasExistClose"
            >
              <CommonSvgIcon icon="icon_xmark" class="h-full w-full" />
            </button>

            <div
              class="flex grow items-center m:order-3 m:mt-[12px] t:mx-[12px] pt:order-2 p:mx-[24px]"
              :class="setClass.headerTools"
              v-if="$slots.headerTools"
            >
              <slot name="headerTools" />
            </div>
          </div>
          <div class="m-popup-body scrollbar --y grow overflow-hidden" :class="setClass.body">
            <slot />
          </div>
          <footer class="m-popup-footer mt-[30px]" :class="setClass.footer" v-if="$slots.footer">
            <slot name="footer" />
          </footer>
          <div class="m-popup-note" :class="setClass.note" v-if="$slots.note">
            <slot name="note" />
          </div>
          <BuyMPopupPromise />
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style lang="postcss">
.m-popup {
  &:before {
    @apply absolute inset-0 bg-[--black] opacity-40 content-default;
  }

  &.\-\-zoom {
    @apply items-center justify-center;

    .m-popup-container {
      @apply rounded-[15px];
    }
  }

  &.\-\-bottomSheet {
    @apply flex-col justify-end;

    .m-popup-container {
      @apply w-full rounded-t-[15px];
    }
  }
}

.m-popup-body {
  &:not(:only-child) {
    @apply mt-[30px];
  }
}

@screen p {
  .m-popup {
    &.\-\-w-1200,
    &.p\:\-\-w-1200,
    &.pt\:\-\-w-1200 {
      &.\-\-zoom {
        .m-popup-container {
          @apply w-[1200px];
        }
      }
    }

    &.\-\-w-740,
    &.p\:\-\-w-740,
    &.pt\:\-\-w-740 {
      &.\-\-zoom {
        .m-popup-container {
          @apply w-[740px];
        }
      }
    }

    &.\-\-w-600,
    &.p\:\-\-w-600,
    &.pt\:\-\-w-600 {
      &.\-\-zoom {
        .m-popup-container {
          @apply w-[600px];
        }
      }
    }

    &.\-\-w-460,
    &.p\:\-\-w-460,
    &.pt\:\-\-w-460 {
      &.\-\-zoom {
        .m-popup-container {
          @apply w-[460px];
        }
      }
    }
  }
}

@screen t {
  .m-popup {
    &.\-\-w-1210,
    &.pt\:\-\-w-1210,
    &.tm\:\-\-w-1210,
    &.t\:\-\-w-1210 {
      &.\-\-zoom {
        .m-popup-container {
          @apply w-[1210px];
        }
      }
    }

    &.\-\-w-740,
    &.pt\:\-\-w-740,
    &.tm\:\-\-w-740,
    &.t\:\-\-w-740 {
      &.\-\-zoom {
        .m-popup-container {
          @apply w-[740px];
        }
      }
    }

    &.\-\-w-600,
    &.pt\:\-\-w-600,
    &.tm\:\-\-w-600,
    &.t\:\-\-w-600 {
      &.\-\-zoom {
        .m-popup-container {
          @apply w-[600px];
        }
      }
    }

    &.\-\-w-460,
    &.pt\:\-\-w-460,
    &.tm\:\-\-w-460,
    &.t\:\-\-w-460 {
      &.\-\-zoom {
        .m-popup-container {
          @apply w-[460px];
        }
      }
    }
  }
}

@screen m {
  .m-popup {
    &.\-\-zoom {
      .m-popup-container {
        @apply mx-[16px];
      }
    }
  }
}
</style>
