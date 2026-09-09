<script setup>
const route = useRoute()
const memberCenter = useMemberCenterStore()
// const {} = storeToRefs(memberCenter)

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
</script>

<template>
  <ul
    class="member-center-navs shrink-0 bg-[--white] p:min-w-[190px] p:space-y-[12px] p:rounded-[15px] p:px-[15px] p:py-[30px]"
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
