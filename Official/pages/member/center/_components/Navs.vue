<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const memberCenter = useMemberCenterStore()
const route = useRoute()
const router = useRouter()

const onBind = (item) => {
  const { to } = item

  if (to) return { to }

  return {}
}

// router-link 只會在自己那一頁掛上 --active(app/router.options.js 的 linkActiveClass),
// 底下還有分頁的項目要靠 activeNames 補。
const onActive = (item) => {
  const { activeNames } = item

  return activeNames ? activeNames.includes(route.name) : false
}

// 手機把整排選單收成下拉。MFormSelect 的 value 只吃單層欄位,所以把路由名稱攤平一份。
const navOptions = computed(() =>
  memberCenter.navs.map((item) => ({
    ...item,
    name: item.to.name,
  }))
)

// 下拉顯示的是「現在在哪一頁」,值從路由推導 —— 不另外存一份,換頁後自然跟著更新。
const activeNavName = computed(() => {
  const nav = memberCenter.navs.find((item) => item.to.name === route.name || onActive(item))

  return nav ? nav.to.name : null
})

const onNavChange = ({ to }) => {
  router.push(to)
}

/* device 預設是 'p',而且沒有全域的更新入口 —— 每一支用到它的元件都要自己量一次
  並掛 resize。少了這兩段,下拉與整排選單的切換會永遠停在桌機那一邊。 */
onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="m:mb-[20px] m:px-[20px]">
    <!-- 手機收成下拉:整排十二個項目在手機會佔掉一整個畫面,要捲很久才看得到內容。
      選了哪一項由 change 帶去那一頁,畫面上顯示的是現在所在的頁面。
      validateEvents 清空是因為這不是表單欄位,是換頁用的控制項。 -->
    <CommonMFormSelect
      name="memberCenterNavs"
      :modelValue="activeNavName"
      :options="navOptions"
      :config="{
        schema: {
          label: 'label',
          value: 'name',
        },
        validateEvents: [],
      }"
      :setClass="{
        main: '--rounded --h-55 --px-12 w-full',
        type: 'line-clamp-1',
        dropdownLabel: 'text-[14px]',
      }"
      @change="onNavChange"
      v-if="device === 'm'"
    />
    <ul
      class="member-center-navs shrink-0 bg-[--white] p:min-w-[190px] p:space-y-[12px] p:rounded-[15px] p:px-[15px] p:py-[30px]"
      v-else
    >
      <li
        class="member-center-navs-item relative"
        :class="{
          '--hover': item.hasHover,
        }"
        v-for="(item, index) in memberCenter.navs"
        :key="`${item.icon}_${index}`"
      >
        <CommonMAnchor
          :text="item.label"
          v-bind="onBind(item)"
          :config="{
            icon: {
              name: item.icon,
              position: 'left',
            },
          }"
          :setClass="{
            main: [
              'member-center-navs-anchor p:--h-50 p:--px-15 p:--rounded-10 w-full p:gap-x-[5px]',
              {
                'active:--bg-green-8b0d active:--text-white': item.hasActive,
                '--active': onActive(item),
              },
              {
                'hover:--text-green-6a2d': item.hasHover,
              },
              item.class.main,
            ],
            icon: 'h-[20px] w-[20px] p-[1px]',
          }"
        />
      </li>
    </ul>
  </div>
</template>

<style lang="postcss">
@screen p {
  .member-center-navs-item {
    &.\-\-hover {
      .member-center-navs-anchor {
        &:not(.\-\-active) {
          &:before {
            @apply absolute left-0 top-1/2 w-[3px] -translate-y-1/2 bg-[--green-9c33] transition-heights duration-300 content-default;
          }
        }

        &:not(:hover) {
          &:before {
            @apply h-0;
          }
        }

        &:hover {
          &:before {
            @apply h-full;
          }
        }
      }
    }
  }
}
</style>
