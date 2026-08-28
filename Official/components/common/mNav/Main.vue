<script setup>
import '@css/_modules/common/mNav/variables.css'
import '@css/_modules/common/mNav/common.css'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { menu } = useNavActions()

const route = useRoute()
const isDevicePT = computed(() => /^(p|t)$/.test(device.value))
const isDeviceM = computed(() => device.value === 'm')

const itemRef = ref(null)
const childrenRef = ref([])
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
      const childrenElem = childrenRef.value[i]
      const rect = submenuElem.getBoundingClientRect()

      childrenElem.style.maxHeight = `${rect.height}px`
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
  <nav class="m-nav">
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
      <ul class="m-nav-menu">
        <li
          class="m-nav-item"
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
            class="m-nav-anchor"
            :class="{ '--active': onAnchorActive(item) }"
            v-bind="onAnchorBind(item)"
          >
            <em>{{ item.label }}</em>
          </component>
          <div
            class="m-nav-children"
            ref="childrenRef"
            v-if="isDevicePT && item.children && item.children.submenu"
          >
            <ul class="m-nav-submenu" ref="submenuRef">
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
      <CommonMNavApp />
      <slot />
    </div>
  </nav>
</template>
