<script setup>
import { onDevice } from '@js/_prototype.js'

import { useNavStore } from '@stores/navs.js'

const route = useRoute()
const device = ref('p') // 預設值先給 p
const isDevicePT = computed(() => /^(p|t)$/.test(device.value))

const nav = useNavStore()
const itemRef = ref(null)
const childernRef = ref([])
const submenuRef = ref([])
const itemCurrIndex = ref(null)

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

const onResize = async () => {
  device.value = onDevice()
  await nextTick()
  onGetChildernHeight()
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <!-- <pre>
    {{ route.name }}
  </pre> -->
  <nav class="m-nav ml-auto shrink-0 m:absolute">
    <div class="m-nav-container flex overflow-hidden m:max-h-0 pt:h-full">
      <ul class="m-nav-menu tracking-default t:gap-x-[15px] pt:flex pt:h-full p:gap-x-[30px]">
        <li
          class="m-nav-item pt:h-full"
          :class="{ '--curr': itemCurrIndex === index }"
          @click="onItemCurrIndex(index)"
          @mouseover="onItemCurrIndex(index)"
          @mouseout="onItemCurrIndex(null)"
          v-for="(item, index) in nav.menu"
          :key="`${item.label}_${index}`"
          ref="itemRef"
        >
          <component
            :is="onAnchorAs(item)"
            class="m-nav-anchor flex flex-col justify-end text-center text-[18px] t:gap-y-[4px] pt:h-full p:min-w-[75px] p:gap-y-[7px]"
            :class="{ '--active': onAnchorActive(item) }"
            v-bind="onAnchorBind(item)"
          >
            <em>{{ item.label }}</em>
          </component>
          <div
            class="m-nav-childern absolute left-0 z-[1] w-full overflow-hidden bg-[--gray-e5] transition-heights duration-300 p:pl-[590px]"
            ref="childernRef"
            v-if="isDevicePT && item.children"
          >
            <ul class="p:py-[25px]" ref="submenuRef" />
          </div>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style lang="postcss">
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
      @apply w-full rounded-t-full transition-colors duration-300 content-default;
    }
  }
}
</style>
