<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { menu } = useNavActions()

const route = useRoute()
const isDevicePT = computed(() => /^(p|t)$/.test(device.value))
const isDeviceM = computed(() => device.value === 'm')

const itemRef = ref(null)
const childernRef = ref([])
const submenuRef = ref([])
const isNavOpen = ref(false)
const itemCurrIndex = ref(null)

const onCtrlClick = () => {
  isNavOpen.value = !isNavOpen.value
}

const onItemCurrIndex = (index) => {
  itemCurrIndex.value = index
}

const onAnchorAs = (item) => {
  const { to, href, children } = item

  // 手機板 直接抓 children submenu 的第一個選單
  if (!isDevicePT.value && children) return 'router-link'
  if (to) return 'router-link'
  if (href) return 'a'
  return 'button'
}

const onAnchorBind = (item) => {
  const as = onAnchorAs(item)
  const { to, href, target, children } = item
  // 手機板 直接抓 children submenu 的第一個選單
  const returnTo = !isDevicePT.value ? children?.submenu?.[0]?.to || to : to

  if (as === 'router-link') {
    return {
      to: returnTo,
      ...(target && {
        target,
        rel: 'noopener',
      }),
    }
  }

  if (as === 'a') {
    return {
      href,
      target: '_blank',
      rel: 'noopener',
    }
  }

  return {
    type: as,
  }
}

const onAnchorActive = (item) => {
  const { id, children } = item
  // 有 children 比對 id 是否有 match route.name
  // 沒有 children nuxt 會自動抓 router-link 判斷 (也是綁定 --active)
  return children && new RegExp(id).test(route.name) ? '--active' : ''
}

const onGetChildernHeight = () => {
  for (let i = 0; i < itemRef.value.length; i += 1) {
    const submenuElem = submenuRef.value[i]

    if (submenuElem) {
      const childernElem = childernRef.value[i]
      const rect = submenuElem.getBoundingClientRect()

      childernElem.style.maxHeight = `${rect.height}px`
    }
  }
}

onResize()

onMounted(() => {
  window.addEventListener('resize', async () => {
    onResize()
    await nextTick()
    onGetChildernHeight()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', async () => {
    onResize()
    await nextTick()
    onGetChildernHeight()
  })
})
</script>

<template>
  <!-- <pre>
    {{ route.name }}
  </pre> -->
  <nav class="m-nav m:shrink-0 pt:grow p:ml-[130px]">
    <button
      type="button"
      class="m-nav-ctrl"
      :class="{ '--active': isNavOpen }"
      @click="onCtrlClick"
      v-if="isDeviceM"
    >
      <i />
    </button>
    <div class="m-nav-container" :class="{ '--open': isNavOpen }">
      <ul class="m-nav-menu tracking-default t:gap-x-[15px] pt:flex pt:h-full p:gap-x-[30px]">
        <li
          class="m-nav-item pt:h-full"
          :class="{ '--curr': itemCurrIndex === index }"
          @click="onItemCurrIndex(index)"
          @mouseover="onItemCurrIndex(index)"
          @mouseout="onItemCurrIndex(null)"
          v-for="(item, index) in menu"
          :key="`${item.label}_${index}`"
          ref="itemRef"
        >
          <component
            :is="onAnchorAs(item)"
            class="m-nav-anchor flex flex-col justify-end text-center text-[18px] t:gap-y-[4px] pt:h-full p:min-w-[75px] p:gap-y-[6px]"
            :class="{ '--active': onAnchorActive(item) }"
            v-bind="onAnchorBind(item)"
          >
            <em>{{ item.label }}</em>
          </component>
          <div
            class="m-nav-childern absolute left-0 z-[1] w-full overflow-hidden bg-[--gray-e5] transition-heights duration-300 p:pl-[590px]"
            ref="childernRef"
            v-if="isDevicePT && item.children && item.children.submenu"
          >
            <ul class="p:py-[25px]" ref="submenuRef">
              <li
                v-for="(submenu, idx) in item.children.submenu"
                :key="`${submenu.label}_${idx}_${index}`"
              >
                <component :is="onAnchorAs(submenu)" v-bind="onAnchorBind(submenu)">
                  <em>{{ submenu.label }}</em>
                </component>
              </li>
            </ul>
          </div>
        </li>
      </ul>
      <slot />
    </div>
  </nav>
</template>

<style lang="postcss">
.m-nav-container {
  @apply overflow-hidden;
}

@screen p {
  .m-nav-menu {
    &:hover {
      .m-nav-item {
        &:hover {
          .m-nav-anchor {
            &:after {
              @apply bg-[--gray-e5];
            }
          }
        }
      }

      .m-nav-anchor {
        &:after {
          @apply bg-transparent;
        }

        &.\-\-active {
          &:after {
            @apply bg-[--green-8b0d];
          }
        }
      }
    }
  }

  .m-nav-anchor {
    &:after {
      @apply h-[6px];
    }
  }
}

@screen pt {
  .m-nav-container {
    @apply flex h-full;
  }

  .m-nav-item {
    &:not(.\-\-curr) {
      .m-nav-childern {
        @apply !max-h-0;
      }
    }
  }

  .m-nav-anchor {
    &.\-\-active {
      &:after {
        @apply bg-[--green-8b0d];
      }
    }

    &:after {
      @apply w-full rounded-full transition-colors duration-300 content-default;
    }
  }
}

@screen m {
  .m-nav-ctrl {
    @apply relative block h-[35px] w-[35px];

    &:before,
    &:after,
    > i {
      @apply absolute left-1/2 top-1/2 h-[3px] w-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[--gray-999];
    }

    /* delay 依 transition-property 順序對應:第 1 值 = margin-top,第 2 值 = transform */
    &:before,
    &:after {
      @apply transition-[margin-top,transform] duration-150 content-default;
    }

    > i {
      @apply transition-opacity duration-150;
    }

    /* 收合:先轉回水平,再展開上下距離 */
    &:not(.\-\-active) {
      &:before,
      &:after {
        @apply delay-[150ms,0ms];
      }

      &:before {
        @apply mt-[-7px];
      }

      &:after {
        @apply mt-[7px];
      }
    }

    /* 展開:先合併到中央,再旋轉成 X */
    &.\-\-active {
      &:before,
      &:after {
        @apply mt-0 delay-[0ms,150ms];
      }

      &:before {
        @apply rotate-45;
      }

      &:after {
        @apply -rotate-45;
      }

      > i {
        @apply opacity-0;
      }
    }
  }

  .m-nav-container {
    @apply absolute left-0 top-[--header-mobile-h] z-[1] w-full bg-[--white] transition-heights duration-300;

    &:not(.\-\-open) {
      @apply h-0;
    }

    &.\-\-open {
      @apply h-[calc(100vh_-_var(--header-mobile-h))];
    }
  }
}
</style>
